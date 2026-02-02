<?php
/**
 * Plugin Name: AutoDesign & Print Manager Connector
 * Description: Secure API Connector for AutoDesign Cloud PWA. Exposes orders and allows status updates.
 * Version: 3.2
 * Author: Pierre
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

define( 'AUTODESIGN_API_VERSION', '3.2' );

class AutoDesign_API_Connector {

    private $namespace = 'autodesign/v1';

    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
    }

    public function register_routes() {
        // GET /orders - Fetch processing-ready orders
        register_rest_route( $this->namespace, '/orders', array(
            'methods'  => 'GET',
            'callback' => array( $this, 'get_orders' ),
            'permission_callback' => array( $this, 'check_permission' ),
        ) );

        // POST /orders/{id}/complete - Update order status
        register_rest_route( $this->namespace, '/orders/(?P<id>\d+)/complete', array(
            'methods'  => 'POST',
            'callback' => array( $this, 'mark_order_complete' ),
            'permission_callback' => array( $this, 'check_permission' ),
        ) );
    }

    public function check_permission( $request ) {
        // simple API key header check for now
        $api_key = $request->get_header( 'X-AutoDesign-Key' );
        $valid_key = defined( 'AUTODESIGN_API_KEY' ) ? AUTODESIGN_API_KEY : '';
        
        if ( empty( $valid_key ) ) {
            return new WP_Error( 'rest_forbidden', 'Server API Key not configured.', array( 'status' => 500 ) );
        }

        return $api_key === $valid_key;
    }

    public function get_orders( $request ) {
        // Check for WooCommerce
        if ( ! class_exists( 'WooCommerce' ) ) {
            return new WP_Error( 'wc_missing', 'WooCommerce is not active.', array( 'status' => 500 ) );
        }

        // 1. Fetch Orders in 'processing' status
        $args = array(
            'status' => 'processing',
            'limit'  => -1, // Fetch all processing orders
            'type'   => 'shop_order',
        );
        
        $orders = wc_get_orders( $args );
        $payload = array();

        foreach ( $orders as $order ) {
            $order_data = array(
                'order_id' => $order->get_id(),
                'status'   => $order->get_status(),
                'billing'  => array(
                    'first_name' => $order->get_billing_first_name(),
                    'last_name'  => $order->get_billing_last_name(),
                    'email'      => $order->get_billing_email(),
                ),
                'items'    => array(),
            );

            foreach ( $order->get_items() as $item_id => $item ) {
                $product = $item->get_product();
                $product_name = $item->get_name();
                
                // Template Key Identification (Regex for JSO 15, WED 042 etc from product name)
                // Example: "Svadobné oznámenie JSO 15" -> "JSO_15"
                // Assuming simple mapping or directly taking code from name if possible. 
                // Detailed regex logic can be enhanced, here we capture the code.
                $template_key = $this->extract_template_key( $product_name );

                // EPO Data Parsing
                // EPO data is usually stored in item meta data.
                // Key 'tm_epo_data' or similar, depending on EPO version. 
                // We will look for all item meta and filter.
                
                $meta_data = $item->get_meta_data();
                $custom_fields = array();
                $has_invite = false; // "Pozvánka k stolu"

                foreach ( $meta_data as $meta ) {
                    $key = $meta->key;
                    $value = $meta->value;
                    
                    // Simple logic to capture specific attributes
                    // Adjust key check based on actual EPO storage (often hidden keys or specific names)
                    if ( strpos( $key, 'Pozvánka k stolu' ) !== false && ( stripos( $value, 'Ano' ) !== false || stripos( $value, 'Áno' ) !== false ) ) {
                        $has_invite = true;
                    }
                    
                    if ( strpos( $key, '_' ) !== 0 ) { // Skip hidden meta
                         $custom_fields[$key] = $value;
                    }
                }

                if ( $template_key ) {
                    $order_data['items'][] = array(
                        'item_id'      => $item_id,
                        'product_name' => $product_name,
                        'template_key' => $template_key,
                        'qty'          => $item->get_quantity(),
                        'has_invite'   => $has_invite,
                        'meta'         => $custom_fields,
                        // Note: Raw text for AI processing should ideally come from a specific text area field in EPO
                        // We will pass all custom fields for the PWA/AI to separate.
                    );
                }
            }

            if ( ! empty( $order_data['items'] ) ) {
                $payload[] = $order_data;
            }
        }

        return rest_ensure_response( array( 'status' => 'success', 'count' => count($payload), 'orders' => $payload ) );
    }

    private function extract_template_key( $name ) {
        // Regex to find patterns like JSO 15, WED 042, etc. and convert space to underscore
        // Matches Capital letters followed by space/underscore and numbers
        if ( preg_match( '/([A-Z]{3})[\s_]?(\d{2,3})/', $name, $matches ) ) {
            return $matches[1] . '_' . $matches[2];
        }
        return null;
    }

    public function mark_order_complete( $request ) {
        $order_id = $request['id'];
        
        if ( ! class_exists( 'WooCommerce' ) ) {
            return new WP_Error( 'wc_missing', 'WooCommerce is not active.', array( 'status' => 500 ) );
        }

        $order = wc_get_order( $order_id );
        if ( ! $order ) {
            return new WP_Error( 'invalid_order', 'Order not found', array( 'status' => 404 ) );
        }

        $order->update_status( 'completed', 'AutoDesign: Order processed and completed by Cloud PWA.' );

        return rest_ensure_response( array( 'status' => 'success', 'order_id' => $order_id, 'message' => 'Order marked as complete.' ) );
    }
}

new AutoDesign_API_Connector();

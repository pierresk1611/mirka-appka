<?php
/**
 * Plugin Name: AutoDesign & Print Manager Connector
 * Description: Secure API Connector for AutoDesign Cloud PWA. Exposes orders and allows status updates.
 * Version: 3.3
 * Author: Pierre
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

define( 'AUTODESIGN_API_VERSION', '3.3' );

class AutoDesign_API_Connector {

    private $namespace = 'autodesign/v1';

    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
        add_action( 'admin_menu', array( $this, 'add_plugin_menu' ) );
        add_action( 'admin_init', array( $this, 'register_settings' ) );
    }

    // --- SETTINGS UI ---
    public function add_plugin_menu() {
        add_menu_page(
            'AutoDesign Settings',
            'AutoDesign',
            'manage_options',
            'autodesign-settings',
            array( $this, 'settings_page_html' ),
            'dashicons-media-text',
            100
        );
    }

    public function register_settings() {
        register_setting( 'autodesign_settings_group', 'autodesign_api_key' );
    }

    public function settings_page_html() {
        ?>
        <div class="wrap">
            <h1>AutoDesign & Print Manager Settings</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields( 'autodesign_settings_group' );
                do_settings_sections( 'autodesign_settings_group' );
                ?>
                <table class="form-table">
                    <tr valign="top">
                    <th scope="row">API Connector Key (X-AutoDesign-Key)</th>
                    <td><input type="text" name="autodesign_api_key" value="<?php echo esc_attr( get_option('autodesign_api_key') ); ?>" class="regular-text" />
                    <p class="description">Vložte tento kľúč do Cloud PWA Nastavení pod názvom <b>WOO_API_KEY</b>.</p></td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            <hr>
            <h3>Endpointy</h3>
            <ul>
                <li><strong>Fetch Orders:</strong> <code>/wp-json/autodesign/v1/orders</code></li>
                <li><strong>Complete Order:</strong> <code>/wp-json/autodesign/v1/orders/{id}/complete</code></li>
            </ul>
        </div>
        <?php
    }

    // --- API ROUTES ---
    public function register_routes() {
        register_rest_route( $this->namespace, '/orders', array(
            'methods'  => 'GET',
            'callback' => array( $this, 'get_orders' ),
            'permission_callback' => array( $this, 'check_permission' ),
        ) );

        register_rest_route( $this->namespace, '/orders/(?P<id>\d+)/complete', array(
            'methods'  => 'POST',
            'callback' => array( $this, 'mark_order_complete' ),
            'permission_callback' => array( $this, 'check_permission' ),
        ) );
    }

    public function check_permission( $request ) {
        $api_key = $request->get_header( 'X-AutoDesign-Key' );
        
        // 1. Check wp-config constant first (priority)
        if ( defined( 'AUTODESIGN_API_KEY' ) ) {
            $valid_key = AUTODESIGN_API_KEY;
        } else {
            // 2. Check DB option
            $valid_key = get_option('autodesign_api_key');
        }
        
        if ( empty( $valid_key ) ) {
            return false;
        }

        return $api_key === $valid_key;
    }

    public function get_orders( $request ) {
        if ( ! class_exists( 'WooCommerce' ) ) {
            return new WP_Error( 'wc_missing', 'WooCommerce is not active.', array( 'status' => 500 ) );
        }

        $args = array(
            'status' => 'processing',
            'limit'  => -1,
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
                ),
                'items'    => array(),
            );

            foreach ( $order->get_items() as $item_id => $item ) {
                $product_name = $item->get_name();
                $template_key = $this->extract_template_key( $product_name );
                
                $meta_data = $item->get_meta_data();
                $custom_fields = array();

                foreach ( $meta_data as $meta ) {
                    if ( strpos( $meta->key, '_' ) !== 0 ) {
                         $custom_fields[$meta->key] = $meta->value;
                    }
                }

                $order_data['items'][] = array(
                    'item_id'      => $item_id,
                    'product_name' => $product_name,
                    'template_key' => $template_key ? $template_key : 'UNKNOWN',
                    'meta'         => $custom_fields,
                );
            }
            $payload[] = $order_data;
        }

        return rest_ensure_response( array( 'status' => 'success', 'orders' => $payload ) );
    }

    private function extract_template_key( $name ) {
        if ( preg_match( '/([A-Z]{3})[\s_]?(\d{2,3})/', $name, $matches ) ) {
            return $matches[1] . '_' . $matches[2];
        }
        return null;
    }

    public function mark_order_complete( $request ) {
        $order_id = $request['id'];
        if ( ! class_exists( 'WooCommerce' ) ) return new WP_Error( 'wc_missing' );

        $order = wc_get_order( $order_id );
        if ( ! $order ) return new WP_Error( 'invalid_order' );

        $order->update_status( 'completed', 'AutoDesign: Order processed.' );
        return rest_ensure_response( array( 'status' => 'success' ) );
    }
}

new AutoDesign_API_Connector();

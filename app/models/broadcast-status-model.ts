export interface BroadcastStatusModel {
    display_phone_number: string;
    phone_number_id: string;
    id: string;
    status: string;
    timestamp: string;
    recipient_id: string;
    error_code?: string;
    error_title?: string;
    error_message?: string;
    error_details?: string;
    error_support_url?: string;
}
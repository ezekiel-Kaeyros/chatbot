export interface BroadcastResponseModel {
    id?: number;
    session_id?: number;
    phone: string;
    template_id?: number;
    response_id?: string;
    status?: string;
    template_name: string;
    message_status: string;
    phone_number_id: string;
    success: boolean;
    created_at?: Date;
    error?: string;
}
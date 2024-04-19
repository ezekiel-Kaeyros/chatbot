
export interface TombolaProductModel {
    id?: number;
    tombola_id: number;
    name: string;
    description?: string;
    price?: number;
    image_url?: string;
    company_name?: string;
    phone_number_id?: string;
    created_at?: Date;
}
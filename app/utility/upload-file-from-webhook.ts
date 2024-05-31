import axios from "axios"
import path from "path";
import fs from 'fs-extra';
import {extensionMapping}  from "../constants/mime-type.constant";

export const getUrlWhatsappFile = async (mediaId: string, whatsapp_token: string) => {
    try {
        const response = await axios.get(`https://graph.facebook.com/v20.0/${mediaId}/`, {
            headers: {
                'Authorization': `Bearer ${whatsapp_token}`
            }
        });

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Axios error:', error.response?.data);
            throw new Error(`Error fetching data: ${error.response?.status} ${error.response?.statusText}`);
        } else {
            console.error('Unexpected error:', error);
            throw new Error('Unexpected error');
        }
    }
}

export const downloadWhatsappFile = async (url: string, whatsapp_token: string, mime_type: string) => {
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${whatsapp_token}`,
            },
            responseType: 'arraybuffer'
        });

        const uploadDir = path.join(__dirname, '../..', 'uploads'); 
        await fs.ensureDir(uploadDir);

        const fileName = `image-${Date.now()}${path.extname(url)}${extensionMapping[mime_type]}`;
        const filePath = path.join(uploadDir, fileName);

        await fs.writeFile(filePath, response.data);

        const fileUrl = `${process.env.BASE_URL || 'http://localhost:3300'}/uploads/${fileName}`;

        return fileUrl;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Axios error:', error.response?.data);
            throw new Error(`Error fetching data: ${error.response?.status} ${error.response?.statusText}`);
        } else {
            console.error('Unexpected error:', error);
            throw new Error('Unexpected error');
        }
    }
}
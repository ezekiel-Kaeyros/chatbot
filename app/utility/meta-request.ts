import { TemplateAction } from "../models/dto/scenario-input";
import { SendWAButtonModel, SendWAListModel, SendWAProductsTemplateModel, SendWATextModel } from "../models/whatsapp-message-type";
import axios from "axios";

export const sendWhatsappMessage = async (
    phone_number_id: string,
    token: string,
    data: SendWATextModel|SendWAButtonModel|SendWAListModel|SendWAProductsTemplateModel
) => {
    const { status } = await axios({
        method: "POST",
        url:
            "https://graph.facebook.com/v17.0/" +
            phone_number_id +
            "/messages?access_token=" +
            token,
        data,
        headers: { "Content-Type": "application/json" },
    });
    return status;
};

export const markMessageAsRead = async (id: string, phone_number_id: string, token: string) => {
    return axios({
        method: "POST",
        url: `https://graph.facebook.com/v19.0/${ phone_number_id }/messages`,
        data: {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": id
        },
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
};

export const sendTemplateMessage = async (phone_number: string, phone_number_id: string, token: string) => {
    return axios({
        method: "POST",
        url: `https://graph.facebook.com/v18.0/${phone_number_id}/messages`,
        data: {
            messaging_product: "whatsapp",
            to: phone_number,
            type: "template",
            template: {
                name: "mother_birthday",
                language: {
                    code: "fr"
                },
                components: [
                    {
                        type: "header",
                        parameters: [
                            {
                                type: "image",
                                image: {
                                    link: "https://res.cloudinary.com/devskills/image/upload/v1712220488/motherbirthday_vlfuh5.jpg"
                                }
                            }
                        ]
                    }
                ]
            }
        },
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
};

export const sendTemplateOfProductsCatalog = async (phone_number: string, phone_number_id: string, token: string) => {
    return axios({
        method: "POST",
        url: `https://graph.facebook.com/v18.0/100609346426084/messages`,
        data: {
            messaging_product: "whatsapp",
            to: phone_number,
            type: "template",
            template: {
                name: "ketourah_mpm",
                language: {
                    code: "fr"
                },
                components: [
                    {
                        type: "button",
                        sub_type: "mpm",
                        index: 0,
                        parameters: [
                            {
                                type: "action",
                                action: {
                                    thumbnail_product_retailer_id: "9e2yp5shjk",
                                    sections: [
                                        {
                                            title: "Soins",
                                            product_items: [
                                                {
                                                    product_retailer_id: "thgtmt61ki"
                                                },
                                                {
                                                    product_retailer_id: "pn837nlskk"
                                                },
                                                {
                                                    product_retailer_id: "lh9dgskord"
                                                },
                                                {
                                                    product_retailer_id: "d84a0aaqw2"
                                                }
                                            ]
                                        },
                                        {
                                            title: "Styling",
                                            product_items: [
                                                {
                                                    product_retailer_id: "chb72mov0s"
                                                },
                                                {
                                                    product_retailer_id: "lzop24kdls"
                                                },
                                                {
                                                    product_retailer_id: "mn7040jh0t"
                                                }
                                            ]
                                        },
                                        {
                                            title: "Entretien cheveux",
                                            product_items: [
                                                {
                                                    product_retailer_id: "9e2yp5shjk"
                                                },
                                                {
                                                    product_retailer_id: "0wcq4qefe4"
                                                },
                                                {
                                                    product_retailer_id: "psx0js7qhs"
                                                },
                                                {
                                                    product_retailer_id: "6m5x44mm4k"
                                                },
                                                {
                                                    product_retailer_id: "sibqcu9tmt"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            }
        },
        headers: {
            "Authorization": `Bearer EAAizDOZAPPVIBO9sihZC4ZB0j5ft7TfMqhvPdIO38cg5ZAAbdNhczVUgHH2GiwLZCqtZANZBl1jZBrstlGfzZAJXzEUvGFN4UTNNPszoW1rM8OlRngHZBIMKivERzcbZClWPfcg2ZCVPTkhgc3EvPSAJgFFa6V7PvMGYuKO0V6ZCsnQFuEGcyIa1ImUDhT9hxvgSSjFZBJ`,
            "Content-Type": "application/json"
        }
    });
};

export const sendProductsTemplate = async (
    phone_number: string,
    phone_number_id: string,
    token: string,
    name: string,
    action: TemplateAction
) => {
    return axios({
        method: "POST",
        url: `https://graph.facebook.com/v18.0/${phone_number_id}/messages`,
        data: {
            messaging_product: "whatsapp",
            to: phone_number,
            type: "template",
            template: {
                name,
                language: {
                    code: "fr"
                },
                components: [
                    {
                        type: "button",
                        sub_type: "mpm",
                        index: 0,
                        parameters: [
                            {
                                type: "action",
                                action
                            }
                        ]
                    }
                ]
            }
        },
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
};

export const getCompanyCatalog = async (token: string, businessId: string = "679854450187854") => {
    return axios({
        method: "GET",
        url: `https://graph.facebook.com/v18.0/${businessId}/owned_product_catalogs`,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
};

export const getCatalogProducts = async (token?: string, catalogId: string = "1413165056026732") => {
    return axios({
        method: "GET",
        url: `https://graph.facebook.com/v19.0/${catalogId}/products`,
        headers: {
            "Authorization": `Bearer EAAizDOZAPPVIBO9sihZC4ZB0j5ft7TfMqhvPdIO38cg5ZAAbdNhczVUgHH2GiwLZCqtZANZBl1jZBrstlGfzZAJXzEUvGFN4UTNNPszoW1rM8OlRngHZBIMKivERzcbZClWPfcg2ZCVPTkhgc3EvPSAJgFFa6V7PvMGYuKO0V6ZCsnQFuEGcyIa1ImUDhT9hxvgSSjFZBJ`,
            "Content-Type": "application/json"
        }
    });
};

export const getCompanyTemplates = async (
    token: string,
    wabaId: string = "109949858629168"
) => {
    return axios({
        method: "GET",
        url: `https://graph.facebook.com/v19.0/${wabaId}/message_templates?fields=name,status`,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
};
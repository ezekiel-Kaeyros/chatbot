"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanyTemplates = exports.getCatalogProducts = exports.getCompanyCatalog = exports.sendProductsTemplate = exports.sendTemplateOfProductsCatalog = exports.sendTemplateMessage = exports.markMessageAsRead = exports.sendWhatsappMessage = void 0;
const axios_1 = __importDefault(require("axios"));
const sendWhatsappMessage = (phone_number_id, token, data) => __awaiter(void 0, void 0, void 0, function* () {
    const { status } = yield (0, axios_1.default)({
        method: "POST",
        url: "https://graph.facebook.com/v17.0/" +
            phone_number_id +
            "/messages?access_token=" +
            token,
        data,
        headers: { "Content-Type": "application/json" },
    });
    return status;
});
exports.sendWhatsappMessage = sendWhatsappMessage;
const markMessageAsRead = (id, phone_number_id, token) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, axios_1.default)({
        method: "POST",
        url: `https://graph.facebook.com/v19.0/${phone_number_id}/messages`,
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
});
exports.markMessageAsRead = markMessageAsRead;
const sendTemplateMessage = (phone_number, phone_number_id, token) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, axios_1.default)({
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
});
exports.sendTemplateMessage = sendTemplateMessage;
const sendTemplateOfProductsCatalog = (phone_number, phone_number_id, token) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, axios_1.default)({
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
});
exports.sendTemplateOfProductsCatalog = sendTemplateOfProductsCatalog;
const sendProductsTemplate = (phone_number, phone_number_id, token, name, action) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, axios_1.default)({
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
});
exports.sendProductsTemplate = sendProductsTemplate;
const getCompanyCatalog = (token, businessId = "679854450187854") => __awaiter(void 0, void 0, void 0, function* () {
    return (0, axios_1.default)({
        method: "GET",
        url: `https://graph.facebook.com/v18.0/${businessId}/owned_product_catalogs`,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
});
exports.getCompanyCatalog = getCompanyCatalog;
const getCatalogProducts = (token, catalogId = "1413165056026732") => __awaiter(void 0, void 0, void 0, function* () {
    return (0, axios_1.default)({
        method: "GET",
        url: `https://graph.facebook.com/v19.0/${catalogId}/products`,
        headers: {
            "Authorization": `Bearer EAAizDOZAPPVIBO9sihZC4ZB0j5ft7TfMqhvPdIO38cg5ZAAbdNhczVUgHH2GiwLZCqtZANZBl1jZBrstlGfzZAJXzEUvGFN4UTNNPszoW1rM8OlRngHZBIMKivERzcbZClWPfcg2ZCVPTkhgc3EvPSAJgFFa6V7PvMGYuKO0V6ZCsnQFuEGcyIa1ImUDhT9hxvgSSjFZBJ`,
            "Content-Type": "application/json"
        }
    });
});
exports.getCatalogProducts = getCatalogProducts;
const getCompanyTemplates = (token, wabaId = "109949858629168") => __awaiter(void 0, void 0, void 0, function* () {
    return (0, axios_1.default)({
        method: "GET",
        url: `https://graph.facebook.com/v19.0/${wabaId}/message_templates?fields=name,status`,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
});
exports.getCompanyTemplates = getCompanyTemplates;
//# sourceMappingURL=meta-request.js.map
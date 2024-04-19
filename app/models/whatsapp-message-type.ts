export type ButtonContent = {
    id: string;
    title: string;
    description?: string;
};

export type WAText = {
    recipientPhone: string;
    message: string;
};

export type WAButtons = {
    recipientPhone: string;
    message: string;
    listOfButtons: ButtonContent[];
};

export type WAList = {
    recipientPhone: string;
    message: string;
    listOfSections: ButtonContent[]
};

export type WAImage = {
    recipientPhone: string;
    link: string;
};

export type WACatalog = {
    recipientPhone: string;
    message: string;
    catalog_name: string;
}

export type SendWATextModel = {
    messaging_product: "whatsapp",
    to: string,
    type: "text",
    text: {
        body: string
    }
};

type actionButtonsModel = {
    type: "reply",
    reply: ButtonContent
};

export type SendWAButtonModel = {
    messaging_product: "whatsapp",
    to: string,
    type: "interactive",
    interactive: {
        type: "button",
        body: {
            text: string
        },
        action: {
            buttons: actionButtonsModel[]
        }
    }
};

export type SendWAListModel = {
    messaging_product: "whatsapp",
    to: string,
    type: "interactive",
    interactive: {
        type: "list",
        body: {
            text: string
        },
        action: {
            button: "Votre choix",
            sections: [
                {
                    title: "Title section",
                    rows: ButtonContent[]
                }
            ]
        }
    }
};

export type SendWAImageModel = {
    messaging_product: "whatsapp",
    to: string,
    type: "image",
    image: {
        link : string
    }
};

export type SendWACatalogModel = {
    messaging_product: "whatsapp",
    to: string,
    type: "interactive",
    interactive: {
        type: "catalog_message",
        body: {
            text: string
        },
        action: {
            name: string,
            
            /* Parameters object is optional */
            parameters: {
              thumbnail_product_retailer_id: "wctwvujzeg"
            }
        },
      
        /* Footer object is optional */
        footer: {
            text: "Best grocery deals on WhatsApp!"
        }
    }
};

export type WAResponseModel = {
    phone_number_id: string;
    phone_number: string;
    name: string;
    type: string;
    data: any;
    id: string;
}
import axios from "axios";
const DASHBOARD_WHATSAPP_ACCESS_URL = "https://nh9dzfa8o7.execute-api.eu-central-1.amazonaws.com/prod/whatsapp-access-queue";
const LOYALTY_PROGRAM_SAVE_POINT_URL = "https://6r10kf27nk.execute-api.eu-central-1.amazonaws.com/prod/points";
const TOMBOLA_RANDOM_DRAW_URL = "https://lbd4bz7xd7.execute-api.eu-central-1.amazonaws.com/prod/random";
const BULKMESSAGE_BROADCAST_STATUS_URL = "https://7ws8gmoso5.execute-api.eu-central-1.amazonaws.com/prod";
//const BULKMESSAGE_BROADCAST_STATUS_URL = "http://127.0.0.1:3000";

export const PullWhatappAccessData = async (requestData: Record<string, unknown>) => {
    return axios.post(DASHBOARD_WHATSAPP_ACCESS_URL, requestData);
};

export const PullSaveLoyaltyPoints = async (requestData: Record<string, unknown>, phone_number_id: string) => {
    return axios.post(`${LOYALTY_PROGRAM_SAVE_POINT_URL}/${phone_number_id}`, requestData);
};

export const PullRandomDraw = async (requestData: Record<string, unknown>, phone_number_id: string) => {
    return axios.post(`${TOMBOLA_RANDOM_DRAW_URL}/${phone_number_id}`, requestData);
};

export const PullBroadcastResponse = async (requestData: Record<string, unknown>, phone_number_id: string) => {
    return axios({
        method: "PUT",
        url: `${BULKMESSAGE_BROADCAST_STATUS_URL}/broadcast-session/${phone_number_id}`,
        data: requestData,
        headers: {
            "Content-Type": "application/json"
        }
    });
};
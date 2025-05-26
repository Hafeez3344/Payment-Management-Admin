import { message } from "antd";
import axios from "axios";
import Cookies from "js-cookie";

const BACKEND_URL = "http://46.202.166.64:7000";
// const BACKEND_URL = "https://payment-management-backend";



//------------------------Login admin api ----------------
export const fn_loginAdminApi = async (data) => {
    try {
        const response = await axios.post(`${BACKEND_URL}/admin/login`, data);
        if (response?.status === 200) {
            return { 
                status: true, 
                message: "Login successful",
                token: response.data?.token,
                id: response.data?.data?._id,
                type: response.data?.type
            }
        }
    } catch (error) {
        if (error?.response?.status === 400) {
            return { status: false, message: error?.response?.data?.message };
        }
        return { status: false, message: "Network Error" };
    }
};


//-----------------get all user payment api------------------------------
export const fn_getAllPaymentApi = async (page = 1, startDate, endDate, status = "") => {
    try {
        const params = new URLSearchParams();
        params.append("page", page);
        if (startDate && endDate) {
            params.append("startDate", startDate);
            params.append("endDate", endDate);
        }
        if (status) {
            params.append("status", status);
        }
        const url = `${BACKEND_URL}/payment/getAll?${params.toString()}`;
        const response = await axios.get(url);
        if (response?.status === 200) {
            return response.data;
        }
    } catch (error) {
        if (error?.response?.status === 400) {
            return { status: false, message: error?.response?.data?.message };
        }
        return { status: false, message: "Network Error" };
    }
};


//-----------------get update payment api------------------------------
export const fn_updatePaymentApi = async (data) => {
    try {
        // Use data._id for the URL, as 'id' is not defined in this scope
        const response = await axios.put(`${BACKEND_URL}/payment/update/${data._id}`, data);
        if (response?.status === 200) {
            return { status: true, message: "Payment updated successfully" };
        }
    } catch (error) {
        if (error?.response?.status === 400) {
            return { status: false, message: error?.response?.data?.message };
        }
        return { status: false, message: "Network Error" };
    }
};


//------------------ get all cards data api------------------------------
export const fn_getAllCardsApi = async () => {
    try {
        const response = await axios.get(`${BACKEND_URL}/payment/summary`);
        if (response?.status === 200) {
            return response.data;
        }
    } catch (error) {
        if (error?.response?.status === 400) {
            return { status: false, message: error?.response?.data?.message };
        }
        return { status: false, message: "Network Error" };
    }
};

//------------------ get all status search api------------------------------
export const fn_getAllStatusSearchApi = async (status) => {
    try {
        const response = await axios.get(`${BACKEND_URL}/payment/filteredPayment?status=${status}`);
        if (response?.status === 200) {
            return response.data;
        }
    } catch (error) {
        if (error?.response?.status === 400) {
            return { status: false, message: error?.response?.data?.message };
        }
        return { status: false, message: "Network Error" };
    }
};







export default BACKEND_URL;
import { message } from "antd";
import axios from "axios";
import Cookies from "js-cookie";

// const BACKEND_URL = "https://backend.gpay.one";
const BACKEND_URL = "http://46.202.166.64:8015";
export const PDF_READ_URL = "https://pdf.royal247.org/parse-statement";

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

export const fn_deleteTransactionApi = async (id) => {
    try {
        const token = Cookies.get("token");
        const response = await axios.delete(`${BACKEND_URL}/ledger/delete/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
        return {
            status: true,
            message: "Transaction Deleted",
        };
    } catch (error) {
        if (error?.response) {
            return {
                status: false,
                message: error?.response?.data?.message || "An error occurred",
            };
        }
        return { status: false, message: "Network Error" };
    }
};

export const fn_getAllTransactionApi = async (status, pageNumber, searchTrnId, searchQuery, merchantId, dateRange, bankId) => {
    try {
        const token = Cookies.get("token");
        const type = Cookies.get("type");
        const adminId = Cookies.get("adminId");

        // Construct URL with date range parameters
        let url = `${BACKEND_URL}/ledger/getAllAdmin?limit=100&page=${pageNumber}`;

        // Add other parameters
        if (status) url += `&status=${status}`;
        if (searchTrnId) url += `&trnNo=${searchTrnId}`;
        if (searchQuery) url += `&utr=${searchQuery}`;
        if (merchantId) url += `&merchantId=${merchantId}`;
        if (bankId) url += `&bankId=${bankId}`;

        // Add date range parameters if they exist
        // if (dateRange && dateRange[0]) {
        //     url += `&startDate=${new Date(dateRange[0].$d).toISOString()}`;
        //     url += `&endDate=${new Date(dateRange[1].$d).toISOString()}`;
        // }

        if (dateRange && dateRange[0]) {
            const startDate = new Date(dateRange[0].$d);
            const endDate = new Date(dateRange[1].$d);

            // Adjust for timezone difference and set start date to beginning of day
            startDate.setHours(0, 0, 0, 0);
            const startISOString = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString();

            // Adjust for timezone difference and set end date to end of day
            endDate.setHours(23, 59, 59, 999);
            const endISOString = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString();

            url += `&startDate=${startISOString}`;
            url += `&endDate=${endISOString}`;
        }

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        return {
            status: true,
            message: "Transactions fetched successfully",
            data: response.data,
        };
    } catch (error) {
        console.error("API Error:", error);
        return {
            status: false,
            message: error?.response?.data?.message || "An error occurred",
        };
    }
};

export const fn_getAdminsTransactionApi = async (status, searchTrnId, searchQuery, merchantId, dateRange, bankId) => {
    try {
        const token = Cookies.get("token");
        const type = Cookies.get("type");
        const adminId = Cookies.get("adminId");

        let url = `${BACKEND_URL}/ledger/getAllAdminWithoutPag`;

        // Add query parameters
        const params = new URLSearchParams();
        if (type === "staff") params.append("adminStaffId", adminId);
        if (status) params.append("status", status);
        if (searchTrnId) params.append("trnNo", searchTrnId);
        if (searchQuery) params.append("utr", searchQuery);
        if (merchantId) params.append("merchantId", merchantId);
        if (bankId) params.append("bankId", bankId);

        // Add date range if present
        // if (dateRange && dateRange[0]) {
        //     params.append("startDate", new Date(dateRange[0].$d).toISOString());
        //     params.append("endDate", new Date(dateRange[1].$d).toISOString());
        // }

        if (dateRange && dateRange[0]) {
            const startDate = new Date(dateRange[0].$d);
            const endDate = new Date(dateRange[1].$d);

            // Set start date to beginning of day
            startDate.setHours(0, 0, 0, 0);

            // Set end date to end of day
            endDate.setHours(23, 59, 59, 999);

            // Adjust for timezone difference
            params.append("startDate", new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString());
            params.append("endDate", new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString());
        }


        // Append params to URL if there are any
        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        return {
            status: true,
            message: "Transactions fetched successfully",
            data: response.data,
        };
    } catch (error) {
        console.error("API Error:", error);
        return {
            status: false,
            message: error?.response?.data?.message || "An error occurred",
            data: { data: [] } // Return empty array for consistent structure
        };
    }
};

export const fn_updateTransactionStatusApi = async (transactionId, data) => {
    try {
        const token = Cookies.get("token");
        const response = await axios.put(
            `${BACKEND_URL}/ledger/update/${transactionId}`,
            data,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                }
            }
        );

        return {
            status: response?.data?.status === "ok",
            message: response?.data?.message || "Transaction updated successfully",
            data: response?.data,
        };
    } catch (error) {
        console.error(`Error updating transaction status:`, error?.response || error);
        return {
            status: false,
            message: error?.response?.data?.message || "An error occurred",
        };
    }
};

export const fn_getCardDataByStatus = async (status, filter, dateRange) => {
    try {
        const token = Cookies.get("token");
        let url = `${BACKEND_URL}/ledger/getCardDataByStatus?status=${status}`;

        // Add filter if present
        if (filter && filter !== "all") {
            url += `&filter=${filter}`;
        }

        // Add date range if present
        if (dateRange && dateRange[0]) {
            const startDate = new Date(dateRange[0].$d);
            const endDate = new Date(dateRange[1].$d);

            // Set start date to beginning of day
            startDate.setHours(0, 0, 0, 0);

            // Set end date to end of day
            endDate.setHours(23, 59, 59, 999);

            // Adjust for timezone difference
            url += `&startDate=${new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString()}`;
            url += `&endDate=${new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString()}`;
        }

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        return {
            status: true,
            message: "Card data fetched successfully",
            data: response.data,
        };
    } catch (error) {
        console.error("API Error:", error);
        return {
            status: false,
            message: error?.response?.data?.message || "An error occurred",
            data: { data: 0, totalTransaction: 0, adminTotalSum: 0, merchantAvailBalance: 0 }
        };
    }
};

export const fn_getExchangeRateApi = async () => {
    try {
        const token = Cookies.get("token");
        const response = await axios.get(`${BACKEND_URL}/exchange-rate/get`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        return {
            status: true,
            message: "Exchange rate fetched successfully",
            data: response.data,
        };
    } catch (error) {
        console.error("API Error:", error);
        return {
            status: false,
            message: error?.response?.data?.message || "An error occurred",
            data: null
        };
    }
};

export default BACKEND_URL;
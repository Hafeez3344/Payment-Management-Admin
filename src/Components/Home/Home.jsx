import { Button, DatePicker, Space, Modal, Form, Input, Select } from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fn_getAdminsTransactionApi, fn_getCardDataByStatus, fn_getAllTransactionApi } from "../../api/api";
import { FaIndianRupeeSign } from "react-icons/fa6";

const Home = ({ authorization, showSidebar }) => {
  const navigate = useNavigate();
  const { RangePicker } = DatePicker;
  const [error, setError] = useState("");
  const totalHeight = window.innerHeight - 366;
  const [loading, setLoading] = useState(true);
  const [totalTrns, setTotalTrns] = useState(0);
  const containerHeight = window.innerHeight - 120;
  const [adminCharges, setAdminCharges] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [dateRange, setDateRange] = useState([null, null]);
  const [totalTransaction, setTotalTransactions] = useState(0);
  const [declineTransactions, setDeclineTransactions] = useState(0);
  const [merchantAvailBalance, setMerchantAvailBalance] = useState(0);
  const [verifiedTransactions, setVerifiedTransactions] = useState(0);
  const [unverifiedTransactions, setUnverifiedTransactions] = useState(0);
  const [cardData, setCardData] = useState({ approved: {},pending: {},failed: {}, });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    window.scroll(0, 0);
    if (!authorization) {
      navigate("/login");
    }
    fetchAllData();
  }, [authorization, navigate]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [approvedData, pendingData, declineData, totalData] =
        await Promise.all([
          fn_getCardDataByStatus("Approved", activeFilter, dateRange),
          fn_getCardDataByStatus("Pending", activeFilter, dateRange),
          fn_getCardDataByStatus("Decline", activeFilter, dateRange),
          fn_getAllTransactionApi(null, 1, null, null, null, dateRange),
        ]);
      // Set transaction counts
      setVerifiedTransactions(approvedData?.data?.data || 0);
      setAdminCharges(approvedData?.data?.adminTotalSum || 0);
      setTotalTrns(approvedData?.data?.totalTransaction || 0);
      setUnverifiedTransactions(pendingData?.data?.data || 0);
      setDeclineTransactions(declineData?.data?.data || 0);
      setTotalTransactions(totalData?.data?.data || 0);
      setMerchantAvailBalance(approvedData?.data?.merchantAvailBalance);

      // Set card data
      setCardData({
        approved: approvedData?.data || {},
        pending: pendingData?.data || {},
        failed: declineData?.data || {},
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorization) {
      fetchAllData();
    }
  }, [dateRange]);

  const resetFilters = () => {
    setDateRange([null, null]);
    setActiveFilter("all");
    fetchAllData();
  };

  const handleFilterClick = async (filterType) => {
    setLoading(true);
    setActiveFilter(filterType);
    setDateRange([null, null]);
    try {
      const [approvedData, pendingData, declineData, totalData] =
        await Promise.all([
          fn_getCardDataByStatus("Approved", filterType, null),
          fn_getCardDataByStatus("Pending", filterType, null),
          fn_getCardDataByStatus("Decline", filterType, null),
          fn_getAllTransactionApi(null, 1, null, null, null, null),
        ]);

      // Set transaction counts
      setVerifiedTransactions(approvedData?.data?.data || 0);
      setAdminCharges(approvedData?.data?.adminTotalSum || 0);
      setTotalTrns(approvedData?.data?.totalTransaction || 0);
      setUnverifiedTransactions(pendingData?.data?.data || 0);
      setDeclineTransactions(declineData?.data?.data || 0);
      setTotalTransactions(totalData?.data?.data || 0);
      setMerchantAvailBalance(approvedData?.data?.merchantAvailBalance);

      // Set card data
      setCardData({
        approved: approvedData?.data || {},
        pending: pendingData?.data || {},
        failed: declineData?.data || {},
      });
    } catch (err) {
      console.error("Error fetching filtered data:", err);
      setError("Failed to fetch filtered data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = () => {
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleModalSubmit = async (values) => {
    try {
      // Here you would typically make an API call to create the payment
      console.log('Payment details:', values);
      setIsModalOpen(false);
      form.resetFields();
      // Refresh the data after creating payment
      fetchAllData();
    } catch (error) {
      console.error('Error creating payment:', error);
    }
  };

  return (
    <div
      className={`bg-gray-100 transition-all duration-500 ${
        showSidebar ? "pl-0 md:pl-[270px]" : "pl-0"
      }`}
      style={{ minHeight: `${containerHeight}px` }}
    >
      <div className="p-7">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-[12px] items-center justify-between mb-5">
          <h1 className="text-[25px] font-[500]">Admin Dashboard</h1>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-2 text-[12px]">
              <button
                onClick={() => handleFilterClick("all")}
                className={`${
                  activeFilter === "all"
                    ? "text-white bg-[#0864E8]"
                    : "text-black"
                } border w-[70px] sm:w-[70px] p-1 rounded`}
              >
                ALL
              </button>
              <button
                onClick={() => handleFilterClick("today")}
                className={`${
                  activeFilter === "today"
                    ? "text-white bg-[#0864E8]"
                    : "text-black"
                } 
                  border w-[70px] sm:w-[70px] p-1 rounded`}
              >
                TODAY
              </button>
              <button
                onClick={() => handleFilterClick("7days")}
                className={`${
                  activeFilter === "7days"
                    ? "text-white bg-[#0864E8]"
                    : "text-black"
                } 
                  border w-[70px] sm:w-[70px] p-1 rounded`}
              >
                7 DAYS
              </button>
              <button
                onClick={() => handleFilterClick("30days")}
                className={`${
                  activeFilter === "30days"
                    ? "text-white bg-[#0864E8]"
                    : "text-black"
                } 
                  border w-[70px] sm:w-[70px] p-1.5 rounded`}
              >
                30 DAYS
              </button>
            </div>

            {/* Date Range Picker */}
            <Space direction="vertical" size={10}>
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  if (!dates) {
                    resetFilters();
                  } else {
                    setDateRange(dates);
                    setActiveFilter("custom");
                  }
                }}
                className="bg-gray-100"
              />
            </Space>
          </div>
        </div>

        {/* Boxes Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-7 text-nowrap">
          <div
            className="bg-white px-[14px] py-[10px] rounded-[5px] shadow text-white"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(0, 150, 102, 1), rgba(59, 221, 169, 1))",
            }}
          >
            <h2 className="text-[13px] uppercase font-[500]">
              Available BALANCE
            </h2>
            <p className="mt-[13px] text-[20px] font-[700]">
              ₹ {Number(merchantAvailBalance).toFixed(2)}
            </p>
            <p className="pt-[3px] text-[13px] font-[500] mb-[7px]">
              Approved Payments:{" "}
              <span className="font-[700]">
              ₹ {Number(verifiedTransactions).toFixed(2) || 0}
              </span>
            </p>
          </div>
          <div
            className="bg-white px-[14px] py-[10px] rounded-[5px] shadow text-white"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(245, 118, 0, 1), rgba(255, 196, 44, 1))",
            }}
          >
            <h2 className="text-[13px] uppercase font-[500]">
              PENDING TRANSACTIONS
            </h2>
            <p className="mt-[13px] text-[20px] font-[700]">
              ₹ {Number(unverifiedTransactions).toFixed(2)}
            </p>
            <p className="pt-[3px] text-[13px] font-[500] mb-[7px]">
              No. of Transactions:{" "}
              <span className="font-[700]">
                {cardData.pending.totalTransaction || 0}
              </span>
            </p>
          </div>
          <div
            className="bg-white px-[14px] py-[10px] rounded-[5px] shadow text-white"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255, 61, 92, 1), rgba(255, 122, 143, 1))",
            }}
          >
            <h2 className="text-[13px] uppercase font-[500]">
              FAILED TRANSACTIONS
            </h2>
            <p className="mt-[13px] text-[20px] font-[700]">
              ₹ {Number(declineTransactions).toFixed(2)}
            </p>
            <p className="pt-[3px] text-[13px] font-[500] mb-[7px]">
              No. of Transactions:{" "}
              <span className="font-[700]">
                {cardData.failed.totalTransaction || 0}
              </span>
            </p>
          </div>
          <div
            className="bg-white px-[14px] py-[10px] rounded-[5px] shadow text-white"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(148, 0, 211, 1), rgba(186, 85, 211, 1))",
            }}
          >
            <h2 className="text-[13px] uppercase font-[500]">
              ADMIN COMMISSION
            </h2>
            <p className="mt-[13px] text-[20px] font-[700]">
              ₹ {Number(adminCharges).toFixed(2)}
            </p>
            <p className="pt-[3px] text-[13px] font-[500] mb-[7px]">
              No. of Transactions:{" "}
              <span className="font-[700]">{totalTrns}</span>
            </p>
          </div>
        </div>

        {/* Transaction Table Section */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex flex-col md:flex-row items-center justify-between pb-3">
            <div className="flex justify-between items-center w-full">
              <p className="text-black font-[500] text-[24px] mr-2">
                All  Transactions
              </p>
              <Button type="primary" className="bg-[#0864E8]" onClick={handleCreatePayment}>Create Payment</Button>
            </div>
          </div>
          <div className="w-full border-t-[1px] border-[#DDDDDD80] hidden sm:block mb-4"></div>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-[#ECF0FA] text-left text-[12px] text-gray-700">
                  <th className="p-4 text-nowrap">TRN-ID</th>
                  <th className="p-4">DATE</th>
                  <th className="p-4 text-nowrap">User Name</th>
                  <th className="p-4 text-nowrap">BANK NAME</th>
                  <th className="p-4 text-nowrap">Merchant NAME</th>
                  <th className="p-4 text-nowrap">TOTAL AMOUNT</th>
                  <th className="p-4 ">UTR#</th>
                  <th className="pl-8">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Static Data */}
                <tr className="text-gray-800 text-sm border-b">
                  <td className="p-4 text-[13px] font-[600] text-[#000000B2]">TRN001</td>
                  <td className="p-4 text-[13px] font-[600] text-[#000000B2] whitespace-nowrap">01 Jan 2024, 10:30 AM</td>
                  <td className="p-4 text-[13px] font-[700] text-[#000000B2] text-nowrap">John Doe</td>
                  <td className="p-4 text-nowrap">
                    <div className="">
                      <span className="text-[13px] font-[700] text-black whitespace-nowrap">
                        HDFC Bank
                        <span className="font-[400]"> - 1234567890</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-[13px] font-[600] text-[#000000B2]">Merchant 1</td>
                  <td className="p-4 text-[13px] font-[700] text-[#000000B2]">
                    <div>
                      <FaIndianRupeeSign className="inline-block mt-[-1px]" /> 5000
                    </div>
                  </td>
                  <td className="p-4 text-[12px] font-[700] text-[#0864E8]">UTR123456</td>
                  <td className="p-4 text-[13px] font-[500]">
                    <span className="px-2 py-1 rounded-[20px] text-nowrap text-[11px] font-[600] min-w-20 flex items-center justify-center bg-[#10CB0026] text-[#0DA000]">
                      Approved
                    </span>
                  </td>
                </tr>
                <tr className="text-gray-800 text-sm border-b">
                  <td className="p-4 text-[13px] font-[600] text-[#000000B2]">TRN002</td>
                  <td className="p-4 text-[13px] font-[600] text-[#000000B2] whitespace-nowrap">01 Jan 2024, 11:45 AM</td>
                  <td className="p-4 text-[13px] font-[700] text-[#000000B2] text-nowrap">Jane Smith</td>
                  <td className="p-4 text-nowrap">
                    <div className="">
                      <p className="text-[13px] font-[700] text-black">
                        UPI
                        <span className="font-[400]"> - user@upi</span>
                      </p>
                    </div>
                  </td>
                  <td className="p-4 text-[13px] font-[600] text-[#000000B2]">Merchant 2</td>
                  <td className="p-4 text-[13px] font-[700] text-[#000000B2]">
                    <div>
                      <FaIndianRupeeSign className="inline-block mt-[-1px]" /> 3000
                    </div>
                  </td>
                  <td className="p-4 text-[12px] font-[700] text-[#0864E8]">UTR789012</td>
                  <td className="p-4 text-[13px] font-[500]">
                    <span className="px-2 py-1 rounded-[20px] text-nowrap text-[11px] font-[600] min-w-20 flex items-center justify-center bg-[#FFC70126] text-[#FFB800]">
                      Pending
                    </span>
                  </td>
                </tr>
                <tr className="text-gray-800 text-sm border-b">
                  <td className="p-4 text-[13px] font-[600] text-[#000000B2]">TRN003</td>
                  <td className="p-4 text-[13px] font-[600] text-[#000000B2] whitespace-nowrap">01 Jan 2024, 02:15 PM</td>
                  <td className="p-4 text-[13px] font-[700] text-[#000000B2] text-nowrap">Mike Johnson</td>
                  <td className="p-4 text-nowrap">
                    <div className="">
                      <p className="text-[13px] font-[700] text-black">
                        Crypto
                        <span className="font-[400]"> - 0x1234...5678</span>
                      </p>
                    </div>
                  </td>
                  <td className="p-4 text-[13px] font-[600] text-[#000000B2]">Merchant 3</td>
                  <td className="p-4 text-[13px] font-[700] text-[#000000B2]">
                    <div>
                      <span className="text-[#000000B2]">$ 100</span>
                      <span className="text-[#000000B2] ml-2">/ ₹ 7500</span>
                    </div>
                  </td>
                  <td className="p-4 text-[12px] font-[700] text-[#0864E8]">UTR345678</td>
                  <td className="p-4 text-[13px] font-[500]">
                    <span className="px-2 py-1 rounded-[20px] text-nowrap text-[11px] font-[600] min-w-20 flex items-center justify-center bg-[#FF7A8F33] text-[#FF002A]">
                      Declined
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Payment Modal */}
        <Modal
          title="Create New Payment"
          open={isModalOpen}
          onCancel={handleModalCancel}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleModalSubmit}
            className="mt-4"
          >
            <Form.Item
              name="userName"
              label="User Name"
              rules={[{ required: true, message: 'Please enter user name' }]}
            >
              <Input placeholder="Enter user name" />
            </Form.Item>

            <Form.Item
              name="amount"
              label="Amount"
              rules={[{ required: true, message: 'Please enter amount' }]}
            >
              <Input type="number" placeholder="Enter amount" prefix="₹" />
            </Form.Item>

            <Form.Item
              name="paymentMethod"
              label="Payment Method"
              rules={[{ required: true, message: 'Please select payment method' }]}
            >
              <Select placeholder="Select payment method">
                <Select.Option value="bank">Bank Transfer</Select.Option>
                <Select.Option value="upi">UPI</Select.Option>
                <Select.Option value="crypto">Crypto</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="accountDetails"
              label="Account Details"
              rules={[{ required: true, message: 'Please enter account details' }]}
            >
              <Input placeholder="Enter account number or UPI ID" />
            </Form.Item>

            <Form.Item
              name="merchantName"
              label="Merchant Name"
              rules={[{ required: true, message: 'Please enter merchant name' }]}
            >
              <Input placeholder="Enter merchant name" />
            </Form.Item>

            <Form.Item className="mb-0 flex justify-end">
              <Button type="default" onClick={handleModalCancel} className="mr-2">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" className="bg-[#0864E8]">
                Create Payment
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

// Add this helper function for status colors
const getStatusColor = (status) => {
  switch (status) {
    case "Approved":
      return "#029868";
    case "Decline":
      return "#FF3F5E";
    case "Pending":
      return "#F67A03";
    default:
      return "#7987A1";
  }
};

const Boxes = ({ number, amount, title, bgColor, link }) => (
  <Link
    to={link}
    className="bg-white px-[14px] py-[10px] rounded-[5px] shadow text-white"
    style={{ backgroundImage: bgColor }}
  >
    <h2 className="text-[13px] uppercase font-[500]">{title}</h2>
    <p className="mt-[13px] text-[20px] font-[700]">₹ {number}</p>
    <p className="pt-[3px] text-[13px] font-[500] mb-[7px]">
      Amount: <span className="font-[700]">₹ {amount}</span>
    </p>
  </Link>
);

export default Home;

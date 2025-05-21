import { Button, DatePicker, Space, Modal, Form, Input, Select, Tooltip, message } from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fn_getAdminsTransactionApi,
  fn_getCardDataByStatus,
  fn_getAllTransactionApi,
} from "../../api/api";
import { FaIndianRupeeSign } from "react-icons/fa6";
import { FiEye, FiCopy } from "react-icons/fi";
import { IoMdCheckmark } from "react-icons/io";
import { GoCircleSlash } from "react-icons/go";
import jsPDF from "jspdf";
import moment from "moment";

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
  const [cardData, setCardData] = useState({
    approved: {},
    pending: {},
    failed: {},
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [downloading, setDownloading] = useState(false);

  // Define static transaction objects for the static rows
  const staticTransactions = [
    {
      trnNo: "TRN1001",
      createdAt: "2024-02-01T09:15:00",
      bankId: {
        accountType: "bank",
        accountNo: "1234567890",
        ifsc: "HDFC0001234",
      },
      total: 8500,
      status: "Pending",
    },
    {
      trnNo: "TRN1002",
      createdAt: "2024-02-01T10:00:00",
      bankId: {
        accountType: "upi",
        accountHolderName: "Amit Kumar",
        iban: "amit@upi",
      },
      
      total: 4200,
      status: "Pending",
    },
    {
      trnNo: "TRN1003",
      createdAt: "2024-02-02T11:30:00",
      bankId: {
        accountType: "bank",
        accountNo: "2345678901",
        ifsc: "ICIC0005678",
      },
      total: 12000,
      status: "Pending",
    },
    {
      trnNo: "TRN1004",
      createdAt: "2024-02-03T12:45:00",
      bankId: {
        accountType: "upi",
        accountHolderName: "Priya Singh",
        iban: "priya@upi",
      },
      total: 3000,
      status: "Pending",
    },
    {
      trnNo: "TRN1005",
      createdAt: "2024-02-04T14:20:00",
      bankId: {
        accountType: "bank",
        accountNo: "3456789012",
        ifsc: "SBI0002345",
      },
      total: 9500,
      status: "Pending",
    },
    {
      trnNo: "TRN1006",
      createdAt: "2024-02-05T15:10:00",
      bankId: {
        accountType: "upi",
        accountHolderName: "Rahul Verma",
        iban: "rahul@upi",
      },
      total: 7800,
      status: "Pending",
    },
  ];

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
      const [approvedData, pendingData, declineData, totalData, recentTrxData] =
        await Promise.all([
          fn_getCardDataByStatus("Approved", activeFilter, dateRange),
          fn_getCardDataByStatus("Pending", activeFilter, dateRange),
          fn_getCardDataByStatus("Decline", activeFilter, dateRange),
          fn_getAllTransactionApi(null, 1, null, null, null, dateRange),
          fn_getAdminsTransactionApi(null, null, null, null, dateRange),
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

      // Set recent transactions
      if (recentTrxData?.status && recentTrxData?.data?.data) {
        setRecentTransactions(recentTrxData.data.data.slice(0, 10));
      } else {
        setRecentTransactions([]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch dashboard data");
      setRecentTransactions([]);
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
      const [approvedData, pendingData, declineData, totalData, recentTrxData] =
        await Promise.all([
          fn_getCardDataByStatus("Approved", filterType, null),
          fn_getCardDataByStatus("Pending", filterType, null),
          fn_getCardDataByStatus("Decline", filterType, null),
          fn_getAllTransactionApi(null, 1, null, null, null, null),
          fn_getAdminsTransactionApi(null, null, null, null, null),
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

      // Set recent transactions
      if (recentTrxData?.status && recentTrxData?.data?.data) {
        setRecentTransactions(recentTrxData.data.data.slice(0, 10));
      } else {
        setRecentTransactions([]);
      }
    } catch (err) {
      console.error("Error fetching filtered data:", err);
      setError("Failed to fetch filtered data");
      setRecentTransactions([]);
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
      console.log("Payment details:", values);
      setIsModalOpen(false);
      form.resetFields();
      // Refresh the data after creating payment
      fetchAllData();
    } catch (error) {
      console.error("Error creating payment:", error);
    }
  };

  // Download Report Handler
  const handleDownloadReport = async () => {
    try {
      setDownloading(true);
      // Combine static and dynamic transactions
      const allTransactions = [
        ...staticTransactions,
        ...recentTransactions.filter(
          trx => trx.bankId && (trx.bankId.accountType === "bank" || trx.bankId.accountType === "upi")
        ),
      ];
      if (!allTransactions.length) {
        alert("No transactions to download.");
        setDownloading(false);
        return;
      }
      const pdf = new jsPDF("l", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const headers = ["TRN-ID", "Date", "Account", "IFSC/UPI", "Amount", "Status"];
      const columnWidths = [30, 50, 50, 50, 30, 30];
      let startY = 30;
      const rowHeight = 12;
      pdf.setFontSize(16);
      pdf.text("Transaction Report", pageWidth / 2, 15, { align: "center" });
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toUTCString()}`, pageWidth / 2, 22, { align: "center" });
      // Table header
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, startY, pageWidth - 2 * margin, rowHeight, "F");
      let currentX = margin;
      headers.forEach((header, idx) => {
        pdf.text(header, currentX + 3, startY + 8);
        currentX += columnWidths[idx];
      });
      // Table rows
      let totalAmount = 0;
      allTransactions.forEach((trx, idx) => {
        startY += rowHeight;
        if (startY > 190) { // New page if needed
          pdf.addPage();
          startY = 20;
          pdf.setFillColor(240, 240, 240);
          pdf.rect(margin, startY, pageWidth - 2 * margin, rowHeight, "F");
          currentX = margin;
          headers.forEach((header, i) => {
            pdf.text(header, currentX + 3, startY + 8);
            currentX += columnWidths[i];
          });
          startY += rowHeight;
        }
        currentX = margin;
        pdf.setFontSize(9);
        pdf.text(trx.trnNo?.toString() || "", currentX + 3, startY + 8);
        currentX += columnWidths[0];
        pdf.text(
          trx.createdAt ? moment(trx.createdAt).format("DD MMM YYYY, hh:mm A") : "-",
          currentX + 3,
          startY + 8
        );
        currentX += columnWidths[1];
        pdf.text(
          trx.bankId?.accountType === "bank"
            ? trx.bankId?.accountNo?.toString() || "-"
            : trx.bankId?.accountType === "upi"
            ? trx.bankId?.accountHolderName || "-"
            : "-",
          currentX + 3,
          startY + 8
        );
        currentX += columnWidths[2];
        pdf.text(
          trx.bankId?.accountType === "bank"
            ? trx.bankId?.ifsc || "MOCKIFSC001"
            : trx.bankId?.accountType === "upi"
            ? trx.bankId?.iban || "-"
            : "-",
          currentX + 3,
          startY + 8
        );
        currentX += columnWidths[3];
        pdf.text(`${trx.total || "0"} INR`, currentX + 3, startY + 8);
        totalAmount += parseFloat(trx.total) || 0;
        currentX += columnWidths[4];
        pdf.text(trx.status || "N/A", currentX + 3, startY + 8);
      });
      // Subtotal row
      startY += rowHeight;
      pdf.setFillColor(200, 200, 200);
      pdf.rect(margin, startY, pageWidth - 2 * margin, rowHeight, "F");
      currentX = margin;
      pdf.setFontSize(10);
      pdf.text("Subtotal", currentX + 3, startY + 8);
      currentX += columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3];
      pdf.text(`${totalAmount.toFixed(2)} INR`, currentX + 3, startY + 8);
      pdf.save(`transaction_report_${new Date().toISOString().slice(0, 10)}.pdf`);
      setDownloading(false);
    } catch (err) {
      setDownloading(false);
      alert("Failed to generate report: " + err.message);
    }
  };

  // Copy transaction details to clipboard
  const handleCopyDetails = (trx) => {
    let details = '';
    if (trx.bankId?.accountType === 'bank') {
      details = [
        `Amount: ₹${trx.total}`,
        `Account: ${trx.bankId?.accountNo || '-'}`,
        `IFSC: ${trx.bankId?.ifsc || 'MOCKIFSC001'}`
      ].join('\n');
    } else if (trx.bankId?.accountType === 'upi') {
      details = [
        `Account Name: ${trx.bankId?.accountHolderName || '-'}`,
        `UPI: ${trx.bankId?.iban || '-'}`
      ].join('\n');
    } else {
      details = 'No copyable details for this transaction type.';
    }
    navigator.clipboard.writeText(details).then(() => {
      message.success('Transaction details copied!');
    });
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
          <h1 className="text-[25px] font-[500]">Payment Management Admin</h1>
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
                "linear-gradient(to right, rgba(245, 118, 0, 1), rgba(255, 196, 44, 1))",
            }}
          >
            <h2 className="text-[13px] uppercase font-[500]">
              Pending Transactions
            </h2>
            <p className="mt-[13px] text-[20px] font-[700]">
              ₹ {Number(unverifiedTransactions).toFixed(2)}
            </p>
            <p className="pt-[3px] text-[13px] font-[500] mb-[7px]">
              No. of Pending Transactions:{" "}
              <span className="font-[700]">
                {cardData.pending.totalTransaction || 0}
              </span>
            </p>
          </div>
          <div
            className="bg-white px-[14px] py-[10px] rounded-[5px] shadow text-white"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(0, 150, 102, 1), rgba(59, 221, 169, 1))",
            }}
          >
            <h2 className="text-[13px] uppercase font-[500]">
              Approved Transactions
            </h2>
            <p className="mt-[13px] text-[20px] font-[700]">
              ₹ {Number(merchantAvailBalance).toFixed(2)}
            </p>
            <p className="pt-[3px] text-[13px] font-[500] mb-[7px]">
              No. of Approved Transactions:{" "}
              <span className="font-[700]">
                ₹ {Number(verifiedTransactions).toFixed(2) || 0}
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
              Rejected Transactions
            </h2>
            <p className="mt-[13px] text-[20px] font-[700]">
              ₹ {Number(declineTransactions).toFixed(2)}
            </p>
            <p className="pt-[3px] text-[13px] font-[500] mb-[7px]">
              No. of Rejected Transactions:{" "}
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
            <h2 className="text-[13px] uppercase font-[500]">in progress</h2>
            <p className="mt-[13px] text-[20px] font-[700]">
              ₹ {Number(adminCharges).toFixed(2)}
            </p>
            <p className="pt-[3px] text-[13px] font-[500] mb-[7px]">
              No. of Processing Transactions:{" "}
              <span className="font-[700]">{totalTrns}</span>
            </p>
          </div>
        </div>

        {/* Transaction Table Section */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex flex-col md:flex-row items-center justify-between pb-3">
            <div className="flex justify-between items-center w-full">
              <p className="text-black font-[500] text-[24px] mr-2">
                All Transactions
              </p>
              <Button type="primary" className="bg-[#0864E8] hover:bg-[#0056b3] text-white font-[500] text-[13px] cursor-pointer border-none" onClick={handleDownloadReport} loading={downloading}>Download Report</Button>
            </div>
          </div>
          <div className="w-full border-t-[1px] border-[#DDDDDD80] hidden sm:block mb-4"></div>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-[#ECF0FA] text-left text-[12px] text-gray-700">
                  <th className="p-4 text-nowrap">TRN-ID</th>
                  <th className="p-4">DATE</th>
                  <th className="p-4 text-nowrap">ACCOUNT NAME</th>
                  <th className="p-4 text-nowrap">{`IFSC / UPI`}</th>
                  <th className="p-4 text-nowrap">AMOUNT</th>
                  <th className="p-4 text-nowrap">STATUS</th>
                  <th className="p-4 text-nowrap">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {/* Static Data Example Rows */}
                <tr className="text-gray-800 text-sm border-b">
                  <td className="p-4 text-[13px] font-[600] text-[#000000B2]">
                    {staticTransactions[0].trnNo}
                  </td>
                  <td className="p-4 text-[13px] font-[600] text-[#000000B2] whitespace-nowrap">
                    {new Date(staticTransactions[0].createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 text-[13px] font-[700] text-[#000000B2] text-nowrap">
                    {staticTransactions[0].bankId.accountNo}
                  </td>
                  <td className="p-4 text-[13px] font-[700] text-[#000000B2] text-nowrap">
                    {staticTransactions[0].bankId.ifsc}
                  </td>
                  <td className="p-4 text-[13px] font-[700] text-[#000000B2]">
                    <FaIndianRupeeSign className="inline-block mt-[-1px]" />{" "}
                    {staticTransactions[0].total}
                  </td>
                  <td className="p-4 text-[13px] font-[500]">
                    <span className="px-2 py-1 rounded-[20px] text-nowrap text-[11px] font-[600] min-w-20 flex items-center justify-center bg-[#FFC70126] text-[#FFB800]">
                      {staticTransactions[0].status}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2 items-center">
                    <Tooltip title="Copy details">
                      <FiCopy className="cursor-pointer text-gray-400 hover:text-blue-600" size={16} onClick={() => handleCopyDetails(staticTransactions[0])} />
                    </Tooltip>
                    <button
                      className="bg-blue-100 text-blue-600 rounded-full px-2 py-2"
                      title="View"
                      onClick={() => {
                        setSelectedTransaction(staticTransactions[0]);
                        setTransactionModalOpen(true);
                      }}
                    >
                      <FiEye />
                    </button>
                  </td>
                </tr>
                <tr className="text-gray-800 text-sm border-b">
                  <td className="p-4 text-[13px] font-[600] text-[#000000B2]">
                    {staticTransactions[1].trnNo}
                  </td>
                  <td className="p-4 text-[13px] font-[600] text-[#000000B2] whitespace-nowrap">
                    {new Date(staticTransactions[1].createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 text-[13px] font-[700] text-[#000000B2] text-nowrap">
                    {staticTransactions[1].bankId.accountHolderName}
                  </td>
                  <td className="p-4 text-[13px] font-[700] text-[#000000B2] text-nowrap">
                    {staticTransactions[1].bankId.iban}
                  </td>
                  <td className="p-4 text-[13px] font-[700] text-[#000000B2]">
                    <FaIndianRupeeSign className="inline-block mt-[-1px]" />{" "}
                    {staticTransactions[1].total}
                  </td>
                  <td className="p-4 text-[13px] font-[500]">
                    <span className="px-2 py-1 rounded-[20px] text-nowrap text-[11px] font-[600] min-w-20 flex items-center justify-center bg-[#FFC70126] text-[#FFB800]">
                      {staticTransactions[1].status}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2 items-center">
                    <Tooltip title="Copy details">
                      <FiCopy className="cursor-pointer text-gray-400 hover:text-blue-600" size={16} onClick={() => handleCopyDetails(staticTransactions[1])} />
                    </Tooltip>
                    <button
                      className="bg-blue-100 text-blue-600 rounded-full px-2 py-2"
                      title="View"
                      onClick={() => {
                        setSelectedTransaction(staticTransactions[1]);
                        setTransactionModalOpen(true);
                      }}
                    >
                      <FiEye />
                    </button>
                  </td>
                </tr>
                {/* Dynamic Data */}
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center p-4">
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="7" className="text-center p-4 text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : recentTransactions.length > 0 ? (
                  recentTransactions
                    .filter(
                      (trx) =>
                        trx.bankId &&
                        (trx.bankId.accountType === "bank" ||
                          trx.bankId.accountType === "upi")
                    )
                    .map((trx, idx) => (
                      <tr
                        key={trx._id || idx}
                        className="text-gray-800 text-sm border-b"
                      >
                        <td className="p-4 text-[13px] font-[600] text-[#000000B2]">
                          {trx.trnNo}
                        </td>
                        <td className="p-4 text-[13px] font-[600] text-[#000000B2] whitespace-nowrap">
                          {trx.createdAt
                            ? new Date(trx.createdAt).toLocaleString()
                            : "-"}
                        </td>
                        {/* Account/Name */}
                        <td className="p-4 text-[13px] font-[700] text-[#000000B2] text-nowrap">
                          {trx.bankId.accountType === "bank"
                            ? trx.bankId.accountNo || "-"
                            : trx.bankId.accountType === "upi"
                            ? trx.bankId.accountHolderName || "-"
                            : "-"}
                        </td>
                        {/* IFSC/UPI */}
                        <td className="p-4 text-[13px] font-[700] text-[#000000B2] text-nowrap">
                          {trx.bankId.accountType === "bank"
                            ? trx.bankId.ifsc || "MOCKIFSC001"
                            : trx.bankId.accountType === "upi"
                            ? trx.bankId.iban || "-"
                            : "-"}
                        </td>
                        {/* Amount */}
                        <td className="p-4 text-[13px] font-[700] text-[#000000B2]">
                          <FaIndianRupeeSign className="inline-block mt-[-1px]" />{" "}
                          {trx.total}
                        </td>
                        {/* Status */}
                        <td className="p-4 text-[13px] font-[500]">
                          <span
                            className={`px-2 py-1 rounded-[20px] text-nowrap text-[11px] font-[600] min-w-20 flex items-center justify-center ${
                              trx.status === "Approved"
                                ? "bg-[#10CB0026] text-[#0DA000]"
                                : trx.status === "Pending"
                                ? "bg-[#FFC70126] text-[#FFB800]"
                                : "bg-[#FF7A8F33] text-[#FF002A]"
                            }`}
                          >
                            {trx.status}
                          </span>
                        </td>
                        {/* Eye Button */}
                        <td className="p-4 flex gap-2 items-center">
                          <Tooltip title="Copy details">
                            <FiCopy className="cursor-pointer text-gray-400 hover:text-blue-600" size={16} onClick={() => handleCopyDetails(trx)} />
                          </Tooltip>
                          <button
                            className="bg-blue-100 text-blue-600 rounded-full px-2 py-2"
                            title="View"
                            onClick={() => {
                              setSelectedTransaction(trx);
                              setTransactionModalOpen(true);
                            }}
                          >
                            <FiEye />
                          </button>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center p-4 text-gray-500">
                      No Transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction Modal */}
        <Modal
          open={transactionModalOpen}
          onCancel={() => setTransactionModalOpen(false)}
          footer={null}
          width={600}
          title={<p className="text-[20px] font-[700]">Transaction Details</p>}
        >
          {selectedTransaction && (
            <div className="flex flex-col">
              <div className="flex flex-col gap-2 mt-4 w-full">
              
                {/* Render fields as in TransactionsTable */}
                {[
                  {
                    label: "Amount:",
                    value: selectedTransaction?.total,
                    isCrypto: selectedTransaction?.bankId?.accountType === "crypto",
                    dollarAmount: selectedTransaction?.dollarAmount,
                  },
                  {
                    label: "Date & Time:",
                    value: selectedTransaction.createdAt ? new Date(selectedTransaction.createdAt).toLocaleString() : "-",
                  },
                  {
                    label: "Account Type:",
                    value: selectedTransaction.bankId?.accountType,
                  },
                  {
                    label: "Account/Name:",
                    value: selectedTransaction.bankId?.accountType === "bank"
                      ? selectedTransaction.bankId?.accountNo
                      : selectedTransaction.bankId?.accountType === "upi"
                      ? selectedTransaction.bankId?.accountHolderName
                      : "-",
                  },
                  {
                    label: "IFSC/UPI:",
                    value: selectedTransaction.bankId?.accountType === "bank"
                      ? selectedTransaction.bankId?.ifsc || "MOCKIFSC001"
                      : selectedTransaction.bankId?.accountType === "upi"
                      ? selectedTransaction.bankId?.iban
                      : "-",
                  },
                ].map((field, index) => (
                  <div className="flex items-center gap-4" key={index}>
                    <p className="text-[12px] font-[600] w-[150px]">{field.label}</p>
                    {field.isCrypto ? (
                      <div className="w-[50%] text-[12px] input-placeholder-black bg-gray-200 p-2">
                        <span>$ {field.dollarAmount}</span>
                        <span className="ml-2">/ ₹ {field.value}</span>
                      </div>
                    ) : (
                      <Input
                        prefix={field.label === "Amount:" ? <FaIndianRupeeSign className="mt-[2px]" /> : null}
                        className="w-[50%] text-[12px] input-placeholder-black bg-gray-200"
                        readOnly
                        value={field.value}
                      />
                    )}
                  </div>
                ))}
                
                
              {/* Bottom Divider and Activity */}
              <div className="border-b w-[370px] mt-4"></div>
             
                {/* Status badge */}
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-[12px] font-[600] w-[150px]">Status:</p>
                  <span className={`px-2 py-1 rounded-[20px] text-nowrap text-[11px] font-[600] min-w-20 flex items-center justify-center ${selectedTransaction.status === "Approved"
                    ? "bg-[#10CB0026] text-[#0DA000]"
                    : selectedTransaction.status === "Pending"
                    ? "bg-[#FFC70126] text-[#FFB800]"
                    : "bg-[#FF7A8F33] text-[#FF002A]"}`}>{selectedTransaction.status}</span>
                </div>
                {/* Approve/Decline buttons for Pending */}
                {selectedTransaction?.status === "Pending" && (
                  <div className="flex gap-2 mt-4">
                    <button
                      className="bg-[#03996933] flex text-[#039969] p-2 rounded hover:bg-[#03996950] text-[13px]"
                      disabled
                    >
                      <IoMdCheckmark className="mt-[3px] mr-[6px]" />
                      Approve Transaction
                    </button>
                    <button
                      className="flex p-2 rounded text-[13px] bg-[#FF405F33] hover:bg-[#FF405F50] text-[#FF3F5F]"
                      disabled
                    >
                      <GoCircleSlash className="mt-[3px] mr-[6px]" />
                      Decline TR
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Home;

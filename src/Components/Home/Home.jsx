import { Button, DatePicker, Space, Modal, Form, Input, Select, Tooltip, message, Pagination } from "antd";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaIndianRupeeSign } from "react-icons/fa6";
import { FiEye, FiCopy, FiCheckCircle, FiXCircle } from "react-icons/fi";
import jsPDF from "jspdf";
import moment from "moment";
import BACKEND_URL, { fn_getAllPaymentApi, fn_updatePaymentApi, fn_getAllCardsApi } from "../../api/api";
import { Button as AntdButton, Input as AntdInput } from "antd";
import { FaCheckCircle, FaHourglassHalf, FaTimesCircle } from "react-icons/fa";

const Home = ({ authorization, showSidebar }) => {
  const navigate = useNavigate();
  const { RangePicker } = DatePicker;
  const totalHeight = window.innerHeight - 366;
  const containerHeight = window.innerHeight - 120;
  const [form] = Form.useForm();
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPayments, setTotalPayments] = useState(0);
  const [dateRange, setDateRange] = useState([null, null]);
  const [dateRange2, setDateRange2] = useState([null, null]);
  const [cardData, setCardData] = useState({
    approvedAmount: 0,
    approvedCount: 0,
    pendingAmount: 0,
    pendingCount: 0,
    declinedAmount: 0,
    declinedCount: 0,
    totalAmount: 0,
    totalCount: 0,
  });
  const [modalRemarks, setModalRemarks] = useState("");
  const [status, setStatus] = useState("");

  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePosition({ x, y });
  };

  useEffect(() => {
    if (!authorization) {
      navigate("/login")
    }
    const [startDate, endDate] = dateRange;
    const fetchPayments = async () => {
      setLoading(true);
      setError("");
      try {
        let params = { page: currentPage };

        const res = await fn_getAllPaymentApi(params.page, startDate || null, endDate || null, status);
        if (res && res.status === 'ok' && Array.isArray(res.data)) {
          setPayments(res.data);
          setTotalPayments(res.pagination?.total || 0);
        } else {
          setPayments([]);
          setTotalPayments(0);
          setError("No payments found.");
        }
      } catch (err) {
        setError("Failed to fetch payments.");
        setPayments([]);
        setTotalPayments(0);
      } finally {
        setLoading(false);
      }
    };

    const fetchCardData = async () => {
      try {
        const res = await fn_getAllCardsApi();
        if (res && res.status !== false) {
          setCardData({
            approvedAmount: res.approvedAmount || 0,
            approvedCount: res.approvedCount || 0,
            pendingAmount: res.pendingAmount || 0,
            pendingCount: res.pendingCount || 0,
            declinedAmount: res.declinedAmount || 0,
            declinedCount: res.declinedCount || 0,
            totalAmount: res.totalAmount || 0,
            totalCount: res.totalCount || 0,
          });
        }
      } catch (err) {
        // Optionally handle error
      }
    };

    fetchPayments();
    fetchCardData();
  }, [currentPage, pageSize, dateRange, status]);

  // Download Report Handler (works with static payments)
  const handleDownloadReport = async () => {
    try {
      setDownloading(true);
      const allTransactions = [...payments];
      if (!allTransactions.length) {
        alert("No transactions to download.");
        setDownloading(false);
        return;
      }
      const pdf = new jsPDF("l", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      // Updated headers and column widths to match table fields
      const headers = [
        "TRN-ID",
        "Date",
        "Account Name",
        "Bank Name",
        "Account Number",
        "IFSC/UPI ID",
        "Amount",
        "Status"
      ];
      // Adjusted column widths for better spacing, ensuring "Status" fits
      const columnWidths = [28, 45, 35, 38, 38, 38, 28, 35];
      const rightMargin = 10; // Adjusted right margin
      let startY = 30;
      const rowHeight = 12;
      pdf.setFontSize(16);
      pdf.text("Transaction Report", pageWidth / 2, 15, { align: "center" });
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toUTCString()}`, pageWidth / 2, 22, { align: "center" });
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, startY, pageWidth - margin - rightMargin, rowHeight, "F");
      let currentX = margin;
      headers.forEach((header, idx) => {
        pdf.text(header, currentX + 3, startY + 8);
        currentX += columnWidths[idx];
      });
      let totalAmount = 0;
      allTransactions.forEach((trx, idx) => {
        startY += rowHeight;
        if (startY > 190) {
          pdf.addPage();
          startY = 20;
          pdf.setFillColor(240, 240, 240);
          pdf.rect(margin, startY, pageWidth - margin - rightMargin, rowHeight, "F");
          currentX = margin;
          headers.forEach((header, i) => {
            pdf.text(header, currentX + 3, startY + 8);
            currentX += columnWidths[i];
          });
          startY += rowHeight;
        }
        currentX = margin;
        pdf.setFontSize(9);
        pdf.text(trx.trnId?.toString() || "", currentX + 3, startY + 8);
        currentX += columnWidths[0];
        pdf.text(
          trx.createdAt ? new Date(trx.createdAt).toLocaleString('en-US', options).replace(',', '').replace(' at', '') : "-",
          currentX + 3,
          startY + 8
        );
        currentX += columnWidths[1];
        pdf.text(trx.accountHolder || "-", currentX + 3, startY + 8);
        currentX += columnWidths[2];
        pdf.text(trx.bankName || "UPI", currentX + 3, startY + 8);
        currentX += columnWidths[3];
        pdf.text(trx.accountNumber || "-", currentX + 3, startY + 8);
        currentX += columnWidths[4];
        pdf.text(trx.ifsc || trx.upi || "-", currentX + 3, startY + 8);
        currentX += columnWidths[5];
        pdf.text(`${trx.amount || "0"} INR`, currentX + 3, startY + 8);
        totalAmount += parseFloat(trx.amount) || 0;
        currentX += columnWidths[6];
        pdf.text(trx.status || "N/A", currentX + 3, startY + 8);
      });
      startY += rowHeight;
      pdf.setFillColor(200, 200, 200);
      pdf.rect(margin, startY, pageWidth - margin - rightMargin, rowHeight, "F");
      currentX = margin;
      pdf.setFontSize(10);
      pdf.text("Subtotal", currentX + 3, startY + 8);
      // Move to Amount column for subtotal
      let subtotalX = margin;
      for (let i = 0; i < 6; i++) subtotalX += columnWidths[i];
      pdf.text(`${totalAmount.toFixed(2)} INR`, subtotalX + 3, startY + 8);
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
    if (trx.bankName && trx.bankName.toLowerCase() === 'upi') {
      details = [
        `Date: ${trx.createdAt ? new Date(trx.createdAt).toLocaleString() : '-'}`,
        `Account Holder Name: ${trx.accountHolder || '-'}`,
        `Bank Name: ${trx.bankName || '-'}`,
        `UPI ID: ${trx.ifsc || trx.upi || '-'}`,
        `Amount: ₹${trx.amount}`
      ].join('\n');
    } else {
      details = [
        `Date: ${trx.createdAt ? new Date(trx.createdAt).toLocaleString() : '-'}`,
        `Account Holder Name: ${trx.accountHolder || '-'}`,
        `Bank Name: ${trx.bankName || '-'}`,
        `Account Number: ${trx.accountNumber || '-'}`,
        `IFSC: ${trx.ifsc || '-'}`,
        `Amount: ₹${trx.amount}`
      ].join('\n');
    }
    navigator.clipboard.writeText(details).then(() => {
      message.success('Transaction details copied!');
    });
  };

  // When opening the modal, initialize modalRemarks
  const openTransactionModal = (trx) => {
    setSelectedTransaction(trx);
    setModalRemarks(trx.remarks || "");
    setTransactionModalOpen(true);
  };

  // Approve/Decline Payment Handlers
  const handleUpdatePaymentStatus = async (status) => {
    if (!selectedTransaction) return;
    try {
      if (modalRemarks === "" && status === "Decline") {
        return message.error("Enter Remarks")
      }
      const updateData = {
        _id: selectedTransaction._id,
        status: status,
        remarks: modalRemarks,
      };
      const res = await fn_updatePaymentApi(updateData);
      if (res && res.status) {
        message.success(`Payment ${status === "Approved" ? "approved" : "declined"} successfully!`);
        setTransactionModalOpen(false);
        // Refresh payments list
        setLoading(true);
        const params = { page: currentPage, limit: pageSize };
        if (dateRange[0] && dateRange[1]) {
          params.startDate = dateRange[0].startOf('day').toISOString();
          params.endDate = dateRange[1].endOf('day').toISOString();
        }
        const refreshed = await fn_getAllPaymentApi(params.page, params.limit, params.startDate, params.endDate);
        if (refreshed && refreshed.status === 'ok' && Array.isArray(refreshed.data)) {
          setPayments(refreshed.data);
          setTotalPayments(refreshed.pagination?.total || 0);
        }
      } else {
        message.error(res?.message || 'Failed to update payment status.');
      }
    } catch (err) {
      message.error('Failed to update payment status.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const resetFilters = () => {
    setCurrentPage(1)
    setDateRange(() => [null, null]);
    setDateRange2(() => [null, null]);
    setActiveFilter("all");
  };

  const options = {
    weekday: 'short',     // Thu
    day: '2-digit',       // 22
    month: 'short',       // May
    year: 'numeric',      // 2025
    hour: '2-digit',      // 11
    minute: '2-digit',    // 13
    hour12: true,         // PM
    timeZone: 'UTC'       // Ensure UTC time
  };

  return (
    <div
      className={`bg-gray-100 transition-all duration-500 ${showSidebar ? "pl-0 md:pl-[270px]" : "pl-0"
        }`}
      style={{ minHeight: `${containerHeight}px` }}
    >
      <div className="p-7">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-[12px] items-center justify-between mb-5">
        </div>

        {/* Summary Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-7 text-nowrap">
          <div className="bg-[#009666] px-[14px] py-[20px] rounded-[5px] shadow text-white flex items-center justify-between">
            <div>
              <h2 className="text-[13px] uppercase font-[500]">Approved Payments</h2>
              <p className="mt-[13px] text-[20px] font-[700]">₹ {cardData.approvedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="pt-[3px] text-[13px] font-[500] mb-[7px]">No. of Approved Payments: <span className="font-[700]">{cardData.approvedCount}</span></p>
            </div>
            <FaCheckCircle className="text-[38px] opacity-70" />
          </div>
          <div className="bg-[#f57600] px-[14px] py-[10px] rounded-[5px] shadow text-white flex items-center justify-between">
            <div>
              <h2 className="text-[13px] uppercase font-[500]">Pending Payments</h2>
              <p className="mt-[13px] text-[20px] font-[700]">₹ {cardData.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="pt-[3px] text-[13px] font-[500] mb-[7px]">No. of Pending Payments: <span className="font-[700]">{cardData.pendingCount}</span></p>
            </div>
            <FaHourglassHalf className="text-[38px] opacity-70" />
          </div>
          <div className="bg-[#ff3d5c] px-[14px] py-[10px] rounded-[5px] shadow text-white flex items-center justify-between">
            <div>
              <h2 className="text-[13px] uppercase font-[500]">Rejected Payments</h2>
              <p className="mt-[13px] text-[20px] font-[700]">₹ {cardData.declinedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="pt-[3px] text-[13px] font-[500] mb-[7px]">No. of Rejected Payments: <span className="font-[700]">{cardData.declinedCount}</span></p>
            </div>
            <FaTimesCircle className="text-[38px] opacity-70" />
          </div>
        </div>

        {/* Transaction Table Section */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col md:flex-row items-center justify-between pb-3">
            <div className="flex flex-col md:flex-row w-full items-center justify-between">
              <p className="text-black font-[500] text-[24px] mr-2 mb-2 md:mb-0">
                All Payments
              </p>
              <div className="flex items-center space-x-2 mb-2 md:mb-0">
                {/* Search by status - moved here */}
                <div className="ml-0">
                  <Select
                    className="w-32"
                    placeholder="Status"
                    value={status}
                    onChange={(value) => {
                      setStatus(value);
                      setCurrentPage(1);
                    }}
                    options={[
                      {
                        value: "",
                        label: (
                          <span className="text-gray-400">All Status</span>
                        ),
                      },
                      { value: "Approved", label: "Approved" },
                      { value: "Pending", label: "Pending" },
                      { value: "Decline", label: "Declined" },
                    ]}
                  />
                </div>
                <Space direction="vertical" size={10} className="ml-4">
                  <RangePicker
                    value={dateRange2}
                    onChange={(dates) => {
                      if (!dates) {
                        resetFilters();
                      } else {
                        const [startDate, endDate] = dates;
                        const start = formatDate(startDate);
                        const end = formatDate(endDate);
                        setDateRange(() => [start, end])
                        setDateRange2(() => [startDate, endDate])
                      }
                    }}
                    className="bg-gray-100"
                  />
                </Space>
                <Button type="primary" className="bg-[#0864E8] hover:bg-[#0056b3] text-white font-[500] text-[13px] cursor-pointer border-none ml-4" onClick={handleDownloadReport} loading={downloading}>Download Report</Button>
              </div>
            </div>
          </div>
          <div className="w-full border-t-[1px] border-[#DDDDDD80] hidden sm:block mb-4"></div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 rounded-xl overflow-hidden bg-white">
              <thead>
                <tr className="bg-[#4f8cff] text-left text-[13px] text-white rounded-t-xl">
                  <th className="p-4 text-nowrap rounded-tl-xl">TRN-ID</th>
                  <th className="p-4 text-center">Date</th>
                  <th className="p-4 text-nowrap">Account Holder Name</th>
                  <th className="p-4 text-nowrap">Bank Name</th>
                  <th className="p-4 text-nowrap">Account Number</th>
                  <th className="p-4 text-nowrap">{`IFSC / UPI ID`}</th>
                  <th className="p-4 text-nowrap">Amount</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-nowrap rounded-tr-xl">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center p-4">Loading...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="9" className="text-center p-4 text-red-500">{error}</td>
                  </tr>
                ) : payments.length > 0 ? (
                  payments.map((trx, idx) => (
                    <tr
                      key={trx._id || idx}
                      className="text-gray-800 text-sm border-b border-[#e3eafc] hover:bg-[#eaf4ff] transition-colors"
                    >
                      <td className="p-4 text-[13px] font-[600] text-[#1a237e]">{trx.trnId}</td>
                      <td className="p-4 text-[13px] font-[600] text-[#1a237e] whitespace-nowrap">{trx.createdAt ? new Date(trx.createdAt).toLocaleString('en-US', options).replace(',', '').replace(' at', '') : "-"}</td>
                      {/* <td className="p-4 text-[13px] font-[600] text-[#1a237e] whitespace-nowrap">{moment(trx.createdAt).is}</td> */}
                      <td className="p-4 text-[13px] font-[700] text-[#1a237e] text-nowrap">{trx.accountHolder || "-"}</td>
                      <td className="p-4 text-[13px] font-[700] text-[#1a237e] text-nowrap">{trx.bankName || "UPI"}</td>
                      <td className="p-4 text-[13px] font-[700] text-[#1a237e] text-nowrap">{trx.accountNumber || "-"}</td>
                      <td className="p-4 text-[13px] font-[700] text-[#1a237e] text-nowrap">{trx.ifsc || trx.upi || ""}</td>
                      <td className="p-4 text-[13px] font-[700] text-[#1a237e] text-nowrap"><FaIndianRupeeSign className="inline-block mt-[-1px]" /> {trx.amount}</td>
                      <td className="p-4 text-[13px] font-[500] text-center">
                        <span className={`px-2 py-1 rounded-[20px] text-nowrap text-[11px] font-[600] min-w-20 flex items-center justify-center ${trx.status === "Approved" ? "bg-[#10CB0026] text-[#0DA000]" : trx.status === "Pending" ? "bg-[#FFC70126] text-[#FFB800]" : "bg-[#FF7A8F33] text-[#FF002A]"}`}>{trx.status}</span>
                      </td>
                      <td className="p-4 flex gap-2 items-center">
                        <button className="bg-blue-100 text-blue-600 rounded-full px-2 py-2" title="View" onClick={() => { openTransactionModal(trx); }}><FiEye /></button>
                        {trx.status === "Approved" && (
                          <Tooltip title="Copy details">
                            <FiCopy className="cursor-pointer text-gray-400 hover:text-blue-600" size={16} onClick={() => handleCopyDetails(trx)} />
                          </Tooltip>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center p-4 text-gray-500">No Transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination below the table */}
          <div className="flex justify-end mt-4">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalPayments}
              showSizeChanger={false}
              onChange={(page) => {
                setCurrentPage(page);
              }}
            />
          </div>
        </div>

        {/* Transaction Modal */}
        <Modal
          open={transactionModalOpen}
          onCancel={() => setTransactionModalOpen(false)}
          footer={null}
          width={1000}
          title={<p className="text-[20px] font-[700]">Transaction Details</p>}
        >
          {selectedTransaction && (
            <div className="flex w-full">
              {/* Left: Transaction Details */}
              <div className="w-1/2 pr-4 border-r border-gray-200">
                <div className="flex flex-col gap-3 mt-2">
                  {[
                    { label: "TRN-ID:", value: selectedTransaction.trnId },
                    {
                      label: "Date:",
                      value: selectedTransaction.createdAt
                        ? new Date(selectedTransaction.createdAt).toLocaleString()
                        : "-"
                    },
                    {
                      label: "Account Holder Name:",
                      value: selectedTransaction.accountHolder || "-"
                    },
                    ...(selectedTransaction.upi
                      ? [{ label: "Bank Name:", value: selectedTransaction.bankName || "UPI" }]
                      : [
                        {
                          label: "Bank Name:",
                          value: selectedTransaction.bankName || "-"
                        },
                        {
                          label: "Account Number:",
                          value: selectedTransaction.accountNumber || "-"
                        }
                      ]),
                    {
                      label: selectedTransaction.upi ? "UPI ID:" : "IFSC:",
                      value: selectedTransaction.upi
                        ? selectedTransaction.upi
                        : selectedTransaction.ifsc || "-"
                    },
                    {
                      label: "Status:",
                      value: selectedTransaction.status
                    }
                  ].map((field, idx) => (
                    <div className="flex items-center gap-3" key={idx}>
                      <p className="text-[12px] font-[600] w-[150px]">{field.label}</p>
                      <AntdInput
                        className="text-[12px] input-placeholder-black bg-gray-200"
                        readOnly
                        value={field.value}
                      />
                    </div>
                  ))}

                  {/* Copy Details */}
                  <div className="flex items-center gap-3 mt-2 border-t pt-2 border-gray-300">
                    <p className="text-[12px] font-[600] w-[150px]">Click to Copy Details:</p>
                    <Tooltip title="Copy details">
                      <FiCopy
                        className="cursor-pointer text-gray-400 hover:text-blue-600"
                        size={16}
                        onClick={() => handleCopyDetails(selectedTransaction)}
                      />
                    </Tooltip>
                  </div>

                  {/* Remarks */}
                  <div className="flex items-start gap-3 mt-2">
                    <p className="text-[12px] font-[600] w-[150px] mt-1">Remarks:</p>
                    <AntdInput.TextArea
                      placeholder="For Decline Payment"
                      className="text-[12px] input-placeholder-black bg-gray-50"
                      value={modalRemarks}
                      onChange={e => setModalRemarks(e.target.value)}
                      autoSize={{ minRows: 2, maxRows: 4 }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-4">
                    <AntdButton
                      className="bg-[#03996933] text-[#039969] p-2 rounded hover:bg-[#03996950] text-[13px] font-semibold flex-1 flex items-center justify-center"
                      disabled={selectedTransaction.status === "Approved"}
                      onClick={() => handleUpdatePaymentStatus("Approved")}
                      icon={<FiCheckCircle className="mr-2" />}
                    >
                      Approve Payment
                    </AntdButton>
                    <AntdButton
                      className="bg-[#FF405F33] text-[#FF3F5F] p-2 rounded text-[13px] font-semibold flex-1 flex items-center justify-center"
                      disabled={selectedTransaction.status === "Decline"}
                      onClick={() => handleUpdatePaymentStatus("Decline")}
                      icon={<FiXCircle className="mr-2" />}
                    >
                      Decline Payment
                    </AntdButton>
                  </div>

                  {/* Payment Logs */}
                  {selectedTransaction.status !== "Pending" && (
                    <div className="mt-4 ">
                      <h3 className="text-[15px] font-[700] mb-2">Payment Logs</h3>
                      <div
                        className="border rounded"
                        style={{
                          maxHeight: "132px", // 3 rows * ~44px per row (adjust if needed)
                          overflowY: "auto",
                        }}
                      >
                        <table className="min-w-full text-[12px]">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="p-2 border text-center">Date</th>
                              <th className="p-2 border text-center">Status</th>
                              <th className="p-2 border text-center">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedTransaction.paymentLogs?.length > 0 ? (
                              selectedTransaction.paymentLogs.map((log, index) => (
                                <tr key={index}>
                                  <td className="p-2 border text-center">
                                    {moment(log.date)
                                      .add(30, "minutes")
                                      .format("DD MMM YYYY, hh:mm A")}
                                  </td>
                                  <td className="p-2 border text-center">
                                    <span
                                      className={`px-2 py-1 rounded-[20px] text-nowrap text-[11px] font-[600] ${log.status === "Approved"
                                        ? "bg-[#10CB0026] text-[#0DA000]"
                                        : log.status === "Pending"
                                          ? "bg-[#FFC70126] text-[#FFB800]"
                                          : log.status === "Manual Verified"
                                            ? "bg-[#0865e851] text-[#0864E8]"
                                            : "bg-[#FF7A8F33] text-[#FF002A]"
                                        }`}
                                    >
                                      {log.status}
                                    </span>
                                  </td>
                                  <td className="p-2 border text-center">
                                    {log.remarks || "-"}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="p-2 border text-center">
                                  No logs yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Image */}
              <div className="w-1/2 pl-4 flex items-center justify-center">
                {selectedTransaction.image ? (
                  <div
                    className="relative rounded-lg border-gray-200 max-w-full max-h-[500px] overflow-hidden cursor-zoom-in"
                    style={{ width: '100%', height: '500px' }} // fixed height, full width container
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    onMouseMove={handleMouseMove}
                  >
                    <img
                      src={`${BACKEND_URL}/${selectedTransaction.image}`}
                      alt="Proof"
                      className="w-full h-full object-contain"
                      style={{
                        transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                        transform: isHovering ? 'scale(2)' : 'scale(1)',
                        transition: 'transform 0.2s ease-out',
                        willChange: 'transform',
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-[280px] h-[280px] flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg text-gray-400">
                    No Image Available
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

import { Button, DatePicker, Space, Modal, Form, Input, Select, Tooltip, message, Pagination } from "antd";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaIndianRupeeSign } from "react-icons/fa6";
import { FiEye, FiCopy } from "react-icons/fi";
import jsPDF from "jspdf";
import moment from "moment";
import { fn_getAllPaymentApi, fn_updatePaymentApi } from "../../api/api";

const Home = ({ authorization, showSidebar }) => {
  const navigate = useNavigate();
  const { RangePicker } = DatePicker;
  const totalHeight = window.innerHeight - 366;
  const containerHeight = window.innerHeight - 120;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPayments, setTotalPayments] = useState(0);
  const [dateRange, setDateRange] = useState([null, null]);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError("");
      try {
        let params = { page: currentPage, limit: pageSize };
        if (dateRange[0] && dateRange[1]) {
          params.startDate = dateRange[0].startOf('day').toISOString();
          params.endDate = dateRange[1].endOf('day').toISOString();
        }
        const res = await fn_getAllPaymentApi(params.page, params.limit, params.startDate, params.endDate);
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
    fetchPayments();
  }, [currentPage, pageSize, dateRange]);

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
        "Account Holder Name",
        "Bank Name",
        "Account Number",
        "IFSC/UPI",
        "Amount",
        "Status"
      ];
      // Reduce column widths slightly and increase right margin for better fit
      const columnWidths = [28, 38, 42, 38, 38, 38, 28, 28];
      const rightMargin = 18; // Increased right margin
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
          trx.createdAt ? moment(trx.createdAt).format("DD MMM YYYY, hh:mm A") : "-",
          currentX + 3,
          startY + 8
        );
        currentX += columnWidths[1];
        pdf.text(trx.accountHolder || "-", currentX + 3, startY + 8);
        currentX += columnWidths[2];
        pdf.text(trx.bankName || "-", currentX + 3, startY + 8);
        currentX += columnWidths[3];
        pdf.text(trx.accountNumber || "-", currentX + 3, startY + 8);
        currentX += columnWidths[4];
        pdf.text(trx.ifsc || trx.accountNumber || "-", currentX + 3, startY + 8);
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
        `Account Number: ${trx.accountNumber || '-'}`,
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

  // Approve/Decline Payment Handlers
  const handleUpdatePaymentStatus = async (status) => {
    if (!selectedTransaction) return;
    try {
      const updateData = {
        _id: selectedTransaction._id,
        status: status,
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
              <button className="text-white bg-[#0864E8] border w-[70px] sm:w-[70px] p-1 rounded">ALL</button>
              <button className="text-black border w-[70px] sm:w-[70px] p-1 rounded">TODAY</button>
              <button className="text-black border w-[70px] sm:w-[70px] p-1 rounded">7 DAYS</button>
              <button className="text-black border w-[70px] sm:w-[70px] p-1.5 rounded">30 DAYS</button>
            </div>
            <Space direction="vertical" size={10} className="ml-4">
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  setDateRange(dates || [null, null]);
                  setCurrentPage(1);
                }}
                className="bg-gray-100"
              />
            </Space>
          </div>
        </div>

        {/* Summary Cards Section (static values) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-7 text-nowrap">
          <div className="bg-white px-[14px] py-[10px] rounded-[5px] shadow text-white" style={{backgroundImage: "linear-gradient(to right, rgba(245, 118, 0, 1), rgba(255, 196, 44, 1))"}}>
            <h2 className="text-[13px] uppercase font-[500]">Pending Transactions</h2>
            <p className="mt-[13px] text-[20px] font-[700]">₹ 0.00</p>
            <p className="pt-[3px] text-[13px] font-[500] mb-[7px]">No. of Pending Transactions: <span className="font-[700]">0</span></p>
          </div>
          <div className="bg-white px-[14px] py-[10px] rounded-[5px] shadow text-white" style={{backgroundImage: "linear-gradient(to right, rgba(0, 150, 102, 1), rgba(59, 221, 169, 1))"}}>
            <h2 className="text-[13px] uppercase font-[500]">Approved Transactions</h2>
            <p className="mt-[13px] text-[20px] font-[700]">₹ 0.00</p>
            <p className="pt-[3px] text-[13px] font-[500] mb-[7px]">No. of Approved Transactions: <span className="font-[700]">₹ 0.00</span></p>
          </div>
          <div className="bg-white px-[14px] py-[10px] rounded-[5px] shadow text-white" style={{backgroundImage: "linear-gradient(to right, rgba(255, 61, 92, 1), rgba(255, 122, 143, 1))"}}>
            <h2 className="text-[13px] uppercase font-[500]">Rejected Transactions</h2>
            <p className="mt-[13px] text-[20px] font-[700]">₹ 0.00</p>
            <p className="pt-[3px] text-[13px] font-[500] mb-[7px]">No. of Rejected Transactions: <span className="font-[700]">0</span></p>
          </div>
          <div className="bg-white px-[14px] py-[10px] rounded-[5px] shadow text-white" style={{backgroundImage: "linear-gradient(to right, rgba(148, 0, 211, 1), rgba(186, 85, 211, 1))"}}>
            <h2 className="text-[13px] uppercase font-[500]">in progress</h2>
            <p className="mt-[13px] text-[20px] font-[700]">₹ 0.00</p>
            <p className="pt-[3px] text-[13px] font-[500] mb-[7px]">No. of Processing Transactions: <span className="font-[700]">0</span></p>
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
                  <th className="p-4">Date</th>
                  <th className="p-4 text-nowrap">Account Holder Name</th>
                  <th className="p-4 text-nowrap">Bank Name</th>
                  <th className="p-4 text-nowrap">Account Number</th>
                  <th className="p-4 text-nowrap">{`IFSC / UPI`}</th>
                  <th className="p-4 text-nowrap">Amount</th>
                  <th className="p-4 text- pl-16">Status</th>
                  <th className="p-4 text-nowrap">Action</th>
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
                      className="text-gray-800 text-sm border-b"
                    >
                      <td className="p-4 text-[13px] font-[600] text-[#000000B2]">
                        {trx.trnId}
                      </td>
                      <td className="p-4 text-[13px] font-[600] text-[#000000B2] whitespace-nowrap">
                        {trx.createdAt
                          ? new Date(trx.createdAt).toLocaleString()
                          : "-"}
                      </td>
                      {/* Account Holder Name */}
                      <td className="p-4 text-[13px] font-[700] text-[#000000B2] text-nowrap">
                        {trx.accountHolder || "-"}
                      </td>
                      {/* Bank Name */}
                      <td className="p-4 text-[13px] font-[700] text-[#000000B2] text-nowrap">
                        {trx.bankName || "-"}
                      </td>
                      {/* Account Number */}
                      <td className="p-4 text-[13px] font-[700] text-[#000000B2] text-nowrap">
                        {trx.accountNumber || "-"}
                      </td>
                      {/* IFSC/UPI */}
                      <td className="p-4 text-[13px] font-[700] text-[#000000B2] text-nowrap">
                        {trx.ifsc || trx.accountNumber || "-"}
                      </td>
                      {/* Amount */}
                      <td className="p-4 text-[13px] font-[700] text-[#000000B2] text-nowrap">
                        <FaIndianRupeeSign className="inline-block mt-[-1px]" />{" "}
                        {trx.amount}
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
          width={600}
          title={<p className="text-[20px] font-[700]">Transaction Details</p>}
        >
          {selectedTransaction && (
            <div className="flex flex-col">
              <div className="flex flex-col gap-2 mt-4 w-full">
                {/* Render fields as in table */}
                {[
                  { label: "TRN-ID:", value: selectedTransaction.trnId },
                  { label: "Date:", value: selectedTransaction.createdAt ? new Date(selectedTransaction.createdAt).toLocaleString() : "-" },
                  { label: "Account Holder Name:", value: selectedTransaction.accountHolder || "-" },
                  { label: "Bank Name:", value: selectedTransaction.bankName || "-" },
                  { label: "Account Number:", value: selectedTransaction.accountNumber || "-" },
                  { label: "IFSC/UPI:", value: selectedTransaction.ifsc || selectedTransaction.accountNumber || "-" },
                  { label: "Amount:", value: selectedTransaction.amount },
                  { label: "Status:", value: selectedTransaction.status },
                ].map((field, index) => (
                  <div className="flex items-center gap-4" key={index}>
                    <p className="text-[12px] font-[600] w-[180px]">{field.label}</p>
                    <Input
                      className="w-[50%] text-[12px] input-placeholder-black bg-gray-200"
                      readOnly
                      value={field.value}
                    />
                  </div>
                ))}
              </div>
              {/* Approve and Decline buttons at the bottom, always visible */}
              <div className="flex gap-4 mt-8 justify-center">
                <button
                  className="bg-[#03996933] text-[#039969] p-2 rounded hover:bg-[#03996950] text-[13px] font-semibold min-w-[160px]"
                  disabled={selectedTransaction.status === "Approved"}
                  onClick={() => handleUpdatePaymentStatus("Approved")}
                >
                  Approve Payment
                </button>
                <button
                  className="bg-[#FF405F33] text-[#FF3F5F] p-2 rounded hover:bg-[#FF405F50] text-[13px] font-semibold min-w-[160px]"
                  disabled={selectedTransaction.status === "Decline"}
                  onClick={() => handleUpdatePaymentStatus("Decline")}
                >
                  Decline
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Home;

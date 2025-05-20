import jsPDF from "jspdf";
import Cookies from "js-cookie";
import moment from "moment-timezone";
import { io } from "socket.io-client";
import { FiEye } from "react-icons/fi";
import { IoMdCheckmark, IoMdDownload } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { GoCircleSlash } from "react-icons/go";
import React, { useState, useEffect } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { FaDollarSign, FaIndianRupeeSign } from "react-icons/fa6";
import {
  Pagination,
  Modal,
  Input,
  notification,
  DatePicker,
  Space,
  Select,
  Button,
} from "antd";
import BACKEND_URL, {
  fn_getAdminsTransactionApi,
  fn_getAllTransactionApi,
  fn_updateTransactionStatusApi,
} from "../../api/api";
import { BsCurrencyExchange } from "react-icons/bs";
import axios from "axios";

const TransactionsTable = ({ authorization, showSidebar }) => {
  const searchParams = new URLSearchParams(location.search);

  const navigate = useNavigate();
  const { RangePicker } = DatePicker;
  const [open, setOpen] = useState(false);
  const status = searchParams.get("status");
  const [allTrns, setAllTrns] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [loader, setLoader] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allBanks, setAllBanks] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [savedRate, setSavedRate] = useState(null);
  const [indianRate, setIndianRate] = useState("");
  const containerHeight = window.innerHeight - 120;
  const [newStatus, setNewStatus] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTrnId, setSearchTrnId] = useState("");
  const [allMerchant, setAllMerchant] = useState([]);
  const [isHovering, setIsHovering] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [merchant, setMerchant] = useState(status || "");
  const [dateRange, setDateRange] = useState([null, null]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const socket = io(`${BACKEND_URL}`, { autoConnect: false });
  const [exchangeRateModal, setExchangeRateModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedFilteredBank, setSelectedFilteredBank] = useState("");
  const [declineButtonClicked, setDeclinedButtonClicked] = useState(false);
  const [selectedFilteredMerchant, setSelectedFilteredMerchant] = useState("");

  const [editPermission, setEditPermission] = useState(true);

  const fetchMerchants = async () => {
    try {
      const result = await fn_getMerchantApi();
      if (result?.status) {
        setAllMerchant(
          result?.data?.data?.map((item) => {
            return { value: item._id, label: item?.merchantName };
          })
        );
      }
    } catch (error) {
      console.error("Error fetching merchants:", error);
    }
  };

  useEffect(() => {
    const userId = Cookies.get("adminId");

    if (!socket.connected) {
      socket.connect(); // Connect only if not already connected
      socket.emit("registerUser", { userId, role: "admin" });
    }

    return () => {
      socket.off("ledgerUpdated");
    };
  }, []);

  const fn_getStaffDetials = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/adminStaff/get/${Cookies.get("adminId")}`);
      if (res?.status === 200) {
        setEditPermission(res?.data?.data?.editPermission)
      }
    } catch (error) {
      console.error("Error fetching staff details:", error);
    }
  }

  // Listen for real-time updates
  useEffect(() => {
    fn_getExchangeRate();
    if (Cookies.get("type") === "staff") {
      fn_getStaffDetials();
    }
    socket.on("ledgerUpdated", (data) => {
      console.log("Ledger Update Received:", data);

      setTransactions((prevLedgers) => {
        if (data.type === "created") {
          return [data.ledger, ...prevLedgers];
        } else if (data.type === "updated") {
          return prevLedgers.map((ledger) =>
            ledger._id === data.ledger._id ? data.ledger : ledger
          );
        }
        return prevLedgers;
      });
    });

    return () => {
      socket.off("ledgerUpdated");
    };
  }, []);


  const fetchBanks = async () => {
    try {
      const result = await fn_getOverAllBanksData("");
      if (result?.status) {
        const banks = result?.data?.data?.map((item) => {
          return {
            value: item._id,
            label:
              item.accountType === "upi" ? (
                <span>
                  UPI - <span className="font-[400]">{item.iban}</span>
                </span>
              ) : item.accountType === "crypto" ? (
                <span>
                  Crypto - <span className="font-[400]">{item.iban}</span>
                </span>
              ) : (
                <span>
                  {item.bankName} -{" "}
                  <span className="font-[400]">{item.iban}</span>
                </span>
              ),
          };
        });

        setAllBanks(banks);
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  const fetchTransactions = async (pageNumber, statusFilter) => {
    try {
      setLoading(true);
      const result = await fn_getAllTransactionApi(
        statusFilter,
        pageNumber,
        searchTrnId,
        searchQuery,
        selectedFilteredMerchant,
        dateRange,
        selectedFilteredBank
      );
      if (result?.status) {
        if (result?.data?.status === "ok") {
          setTransactions(result?.data?.data);
          setTotalPages(result?.data?.totalPages);
        } else {
          setTransactions([]);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTransactions = async (statusFilter) => {
    try {
      const result = await fn_getAdminsTransactionApi(
        statusFilter,
        searchTrnId,
        searchQuery,
        selectedFilteredMerchant,
        dateRange,
        selectedFilteredBank
      );
      if (result?.status) {
        if (result?.data?.status === "ok") {
          console.log(result);
          setAllTrns(() => [...result?.data?.data]);
        } else {
          setAllTrns([]);
        }
      }
    } catch (error) {
      setAllTrns([]);
    }
  };

  useEffect(() => {
    window.scroll(0, 0);
    if (!authorization) {
      navigate("/login");
      return;
    }
    fetchMerchants();
    fetchBanks();
    fetchTransactions(currentPage, merchant);
    fetchAllTransactions(merchant);
  }, [
    currentPage,
    merchant,
    searchTrnId,
    searchQuery,
    selectedFilteredMerchant,
    selectedFilteredBank,
    dateRange,
  ]);

  useEffect(() => {
    fetchAllTransactions(merchant);
  }, [
    merchant,
    searchTrnId,
    searchQuery,
    selectedFilteredMerchant,
    selectedFilteredBank,
    dateRange,
  ]);

  // Add effect to reset page when search params change
  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 whenever search criteria changes
  }, [
    searchTrnId,
    searchQuery,
    selectedFilteredMerchant,
    selectedFilteredBank,
    dateRange,
    merchant,
  ]);

  const handleViewTransaction = (transaction) => {
    // Reset all states first
    setNewStatus(null);
    setDeclinedButtonClicked(false);
    setSelectedOption(null);
    setIsEdit(false);
    // Then set the new transaction
    setSelectedTransaction(transaction);
    setOpen(true);
  };

  // Add a new function to handle modal close
  const handleModalClose = () => {
    setOpen(false);
    setIsEdit(false);
    setNewStatus(null);
    setDeclinedButtonClicked(false);
    setSelectedOption(null);
    setSelectedTransaction(null);
  };

  const handleTransactionAction = async (action, transactionId) => {
    const adminId = Cookies.get("adminId");
    const userType = Cookies.get("type");

    const payload = {
      status: action,
      // walletCredit: action === "Approved" ? true : false,
      trnStatus:
        action === "Approved" ? "Points Pending" : "Transaction Decline",
      reason: selectedOption,
    };

    // Add adminStaffId to payload if user type is staff
    if (userType === "staff") {
      payload.adminStaffId = adminId;
    }

    const response = await fn_updateTransactionStatusApi(
      transactionId,
      payload
    );
    if (response.status) {
      // Fetch updated transactions
      await fetchTransactions(currentPage, merchant);
      // Fetch all transactions for the report
      await fetchAllTransactions(merchant);
      // Update the selected transaction in the modal
      const updatedTransaction = transactions.find(
        (t) => t._id === transactionId
      );
      if (updatedTransaction) {
        setSelectedTransaction(updatedTransaction);
      }
      notification.success({
        message: "Success",
        description: "Transaction Updated!",
        placement: "topRight",
      });
      setIsEdit(false);
      setOpen(false);
      setNewStatus(null);
      setDeclinedButtonClicked(false);
      setSelectedOption(null);
    } else {
      setIsEdit(false);
      console.error(`Failed to ${action} transaction:`, response.message);
    }
  };

  const options = [
    "utr mismatch",
    "slip not visible",
    "amount mismatch",
    "Payment not received",
    "fake slip",
    "duplicate utr",
    "others",
  ];

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePosition({ x, y });
  };

  const handleDownloadReport = async () => {
    try {
      if (!allTrns || allTrns.length === 0) {
        notification.warning({
          message: "No Data",
          description: "There are no transactions to include in the report.",
          placement: "topRight",
        });
        return;
      }

      console.log(`Generating PDF with ${allTrns.length} transactions`);

      setLoader(true);
      const pdf = new jsPDF("l", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      const firstPageRows = 12;
      const subsequentPageRows = 13;

      const headers = [
        "TRN-ID",
        "Date",
        "User Name",
        "Bank Name",
        "Merchant",
        "Amount",
        "UTR#",
        "Status",
      ];
      const columnWidths = [25, 50, 25, 55, 30, 30, 35, 25];

      const startX = margin;
      let startY = 40;
      const rowHeight = 12;

      let totalAmount = 0; // Initialize totalAmount for the entire report

      pdf.setFontSize(16);
      pdf.text("Transaction Report", pageWidth / 2, 20, { align: "center" });
      pdf.setFontSize(12);
      pdf.text(`Generated on: ${new Date().toUTCString()}`, pageWidth / 2, 30, {
        align: "center",
      });

      // Calculate total pages needed
      const remainingTrns =
        allTrns.length > firstPageRows ? allTrns.length - firstPageRows : 0;
      const additionalPages = Math.ceil(remainingTrns / subsequentPageRows);
      const totalPages = additionalPages + (allTrns.length > 0 ? 1 : 0);

      let processedTrns = 0;

      // First page with 12 rows
      if (allTrns.length > 0) {
        startY = 25 + rowHeight;

        pdf.setFillColor(240, 240, 240);
        pdf.rect(startX, startY, pageWidth - 2 * margin, rowHeight, "F");
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "bold");

        let currentX = startX;
        headers.forEach((header, index) => {
          pdf.text(header, currentX + 3, startY + 8);
          currentX += columnWidths[index];
        });

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);

        const firstPageTransactions = allTrns.slice(0, firstPageRows);
        firstPageTransactions.forEach((trn, index) => {
          startY += rowHeight;
          if (index % 2 === 1) {
            pdf.setFillColor(248, 248, 248);
            pdf.rect(startX, startY, pageWidth - 2 * margin, rowHeight, "F");
          }

          currentX = startX;
          pdf.text(trn.trnNo?.toString() || "", currentX + 3, startY + 8);
          currentX += columnWidths[0];
          pdf.text(
            trn.createdAt
              ? `${moment.utc(trn?.createdAt).format("DD MMM YYYY, hh:mm A")}`
              : "",
            currentX + 3,
            startY + 8
          );
          currentX += columnWidths[1];
          pdf.text(trn.username || "GUEST", currentX + 3, startY + 8);
          currentX += columnWidths[2];

          const bankName =
            trn.bankId?.bankName === "UPI"
              ? `UPI - ${trn.bankId?.iban || ""}`
              : trn.bankId?.bankName || "N/A";
          pdf.text(bankName, currentX + 3, startY + 8);
          currentX += columnWidths[3];

          const merchantName =
            trn.merchantId?.merchantName || trn.merchant || "N/A";
          pdf.text(merchantName, currentX + 3, startY + 8);
          currentX += columnWidths[4];

          pdf.text(`${trn.total || "0"} INR`, currentX + 3, startY + 8, {
            align: "left",
          });
          totalAmount += parseFloat(trn.total) || 0; // Add to totalAmount
          currentX += columnWidths[5];
          pdf.text(trn.utr?.toString() || "", currentX + 3, startY + 8);
          currentX += columnWidths[6];
          pdf.text(trn.status || "N/A", currentX + 3, startY + 8);
        });

        processedTrns = firstPageRows;

        pdf.setFontSize(10);
        pdf.text(`Page 1 of ${totalPages}`, margin, pageHeight - 10);
      }

      // Subsequent pages with 13 rows each
      for (let page = 1; page <= additionalPages; page++) {
        pdf.addPage();

        startY = 20;

        pdf.setFillColor(240, 240, 240);
        pdf.rect(startX, startY, pageWidth - 2 * margin, rowHeight, "F");
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "bold");

        let currentX = startX;
        headers.forEach((header, index) => {
          pdf.text(header, currentX + 3, startY + 8);
          currentX += columnWidths[index];
        });

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);

        const pageTransactions = allTrns.slice(
          processedTrns,
          processedTrns + subsequentPageRows
        );
        pageTransactions.forEach((trn, index) => {
          startY += rowHeight;
          if (index % 2 === 1) {
            pdf.setFillColor(248, 248, 248);
            pdf.rect(startX, startY, pageWidth - 2 * margin, rowHeight, "F");
          }

          currentX = startX;
          pdf.text(trn.trnNo?.toString() || "", currentX + 3, startY + 8);
          currentX += columnWidths[0];
          pdf.text(
            trn.createdAt
              ? `${moment.utc(trn?.createdAt).format("DD MMM YYYY, hh:mm A")}`
              : "",
            currentX + 3,
            startY + 8
          );
          currentX += columnWidths[1];
          pdf.text(trn.username || "GUEST", currentX + 3, startY + 8);
          currentX += columnWidths[2];

          const bankName =
            trn.bankId?.bankName === "UPI"
              ? `UPI - ${trn.bankId?.iban || ""}`
              : trn.bankId?.bankName || "N/A";
          pdf.text(bankName, currentX + 3, startY + 8);
          currentX += columnWidths[3];

          const merchantName =
            trn.merchantId?.merchantName || trn.merchant || "N/A";
          pdf.text(merchantName, currentX + 3, startY + 8);
          currentX += columnWidths[4];

          pdf.text(`${trn.total || "0"} INR`, currentX + 3, startY + 8, {
            align: "left",
          });
          totalAmount += parseFloat(trn.total) || 0; // Add to totalAmount
          currentX += columnWidths[5];
          pdf.text(trn.utr?.toString() || "", currentX + 3, startY + 8);
          currentX += columnWidths[6];
          pdf.text(trn.status || "N/A", currentX + 3, startY + 8);
        });

        processedTrns += pageTransactions.length;

        pdf.setFontSize(10);
        pdf.text(`Page ${page + 1} of ${totalPages}`, margin, pageHeight - 10);
      }

      // Add subtotal to the last page (after processing all transactions)
      const lastPageStartY = pageHeight - 30; // Position for subtotal row
      pdf.setFillColor(200, 200, 200); // Light gray background for subtotal row
      pdf.rect(startX, lastPageStartY, pageWidth - 2 * margin, rowHeight, "F"); // Draw the background for the subtotal row

      let currentX = startX;
      pdf.setFontSize(10);
      pdf.text("Subtotal", currentX + 3, lastPageStartY + 8); // Label for subtotal
      currentX +=
        columnWidths[0] +
        columnWidths[1] +
        columnWidths[2] +
        columnWidths[3] +
        columnWidths[4] +
        columnWidths[5]; // Skip other columns for subtotal row
      pdf.text(
        `${totalAmount.toFixed(2)} INR`,
        currentX + 3,
        lastPageStartY + 8,
        { align: "left" }
      ); // Total amount

      pdf.save(
        `transaction_report_${new Date().toISOString().slice(0, 10)}.pdf`
      );
      setLoader(false);
      notification.success({
        message: "Success",
        description: "Report downloaded successfully!",
        placement: "topRight",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      setLoader(false);
      notification.error({
        message: "Error",
        description: `Failed to generate report: ${error.message}`,
        placement: "topRight",
      });
    }
  };

  const fn_closeExchangeModal = () => {
    setExchangeRateModal(false);
  };

  const fn_submitRate = async (e) => {
    e.preventDefault();
    if (!indianRate || indianRate === "") {
      notification.error({
        message: "Error",
        description: "Please enter a valid rate.",
        placement: "topRight",
      });
      return;
    }
    const payload = {
      coin: 1,
      inr: Number(indianRate),
    };
    if (savedRate) {
      payload.id = savedRate._id;
    }
    const result = await fn_setExchangeRate(payload);
    if (result.status) {
      setExchangeRateModal(false);
      setIndianRate("");
      fn_getExchangeRate();
      notification.success({
        message: "Success",
        description: "Exchange rate updated successfully!",
        placement: "topRight",
      });
    } else {
      notification.error({
        message: "Error",
        description: result.message,
        placement: "topRight",
      });
    }
  };

  const fn_getExchangeRate = async () => {
    const response = await fn_getExchangeRateApi();
    if (response?.status) {
      setIndianRate(response?.data?.inr || "");
      setSavedRate(response?.data);
    }
  };

  function getMonthName(monthIndex) {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months[monthIndex];
  }

  return (
    <>
      <div
        style={{ minHeight: `${containerHeight}px` }}
        className={`bg-gray-100 transition-all duration-500 ${showSidebar ? "pl-0 md:pl-[270px]" : "pl-0"
          }`}
      >
        <div className="p-7">
          <div className="flex flex-col md:flex-row gap-[12px] items-center justify-between mb-4">
            <h1 className="text-[25px] font-[500]">All Transaction</h1>
            <p className="text-[#7987A1] text-[13px] md:text-[15px] font-[400]">
              Dashboard - Data Table
            </p>
          </div>
          <div
            className={`flex mb-2 ${savedRate ? "justify-between" : "justify-end"
              }`}
          >
            {savedRate && (
              <div>
                <p className="text-[14px] font-[600] text-gray-500">
                  For Crypto Payment:
                </p>
                <p className="text-[14px] font-[600]">
                  USDT Rate:{" "}
                  <span className="text-green-600">
                    1 USDT = {savedRate?.inr} INR
                  </span>
                </p>
              </div>
            )}
            <div className="flex gap-[15px]">
              {Cookies.get("type") === "admin" && (
                <Button type="primary" onClick={() => setExchangeRateModal(true)}>
                  <BsCurrencyExchange />
                  USDT Exchange Rate
                </Button>
              )}
              <Button
                type="primary"
                onClick={async () => {
                  if (!dateRange?.[0])
                    return notification.error({
                      message: "Error",
                      description: "Select Date Range",
                      placement: "topRight",
                    });
                  handleDownloadReport();
                }}
                disabled={loader}
              >
                {loader ? (
                  <p className="">
                    <IoMdDownload className="inline-block" /> Downloading
                    Report...
                  </p>
                ) : (
                  <p className="">
                    <IoMdDownload className="inline-block" /> Download Report
                  </p>
                )}
              </Button>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex flex-col md:flex-row items-center justify-between pb-3">
              <div>
                <p className="text-black font-[500] text-[24px] mr-2">
                  Filters
                </p>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                {/* DropDown of status */}
                <div>
                  <Select
                    className="w-32"
                    placeholder="Status"
                    value={merchant}
                    onChange={(value) => {
                      setMerchant(value);
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
                {/* Search by Merchant */}
                <div>
                  <Select
                    className="w-40"
                    placeholder="Select Merchant"
                    value={selectedFilteredMerchant.label}
                    onChange={(e) => {
                      setSelectedFilteredMerchant(e);
                    }}
                    options={[
                      {
                        value: "",
                        label: (
                          <span className="text-gray-400">All Merchant</span>
                        ),
                      },
                      ...allMerchant,
                    ]}
                  />
                </div>
                {/* Search by Bank */}
                <div>
                  <Select
                    className="w-60"
                    placeholder="Select Bank"
                    value={selectedFilteredBank}
                    onChange={(e) => {
                      setSelectedFilteredBank(e);
                    }}
                    options={[
                      {
                        value: "",
                        label: <span className="text-gray-400">All Bank</span>,
                      },
                      ...allBanks,
                    ]}
                  />
                </div>
                {/* Search by date  */}
                <Space direction="vertical" size={10}>
                  <RangePicker
                    value={dateRange}
                    onChange={(dates) => {
                      setDateRange(dates);
                    }}
                  />
                </Space>
                {/* Search By TRN / Search By UTR */}
                {/* <div className="flex flex-col w-full md:w-40">
                  <input
                    type="text"
                    placeholder="Search by TRN-ID"
                    value={searchTrnId}
                    onChange={(e) => setSearchTrnId(e.target.value)}
                    className="border w-full border-gray-300 rounded py-1.5 text-[12px] pl-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div> */}
                {/* Search by UTR*/}
                <div className="flex flex-col w-full md:w-40">
                  <input
                    type="text"
                    placeholder="Search by UTR / Trn No"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border w-full border-gray-300 rounded py-1.5 text-[12px] pl-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>
            <div className="w-full border-t-[1px] border-[#DDDDDD80] hidden sm:block mb-4"></div>
            <div className="overflow-x-auto">
              {/* my page table  */}
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
                    <th className="pl-7 cursor-pointer">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="text-center p-4">
                        Loading...
                      </td>
                    </tr>
                  ) : transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <tr
                        key={transaction?._id}
                        className="text-gray-800 text-sm border-b"
                      >
                        <td className="p-4 text-[13px] font-[600] text-[#000000B2]">
                          {transaction?.trnNo}
                        </td>
                        <td className="p-4 text-[13px] font-[600] text-[#000000B2] whitespace-nowrap">
                          {moment
                            .utc(transaction?.createdAt)
                            .format("DD MMM YYYY, hh:mm A")}
                        </td>
                        <td className="p-4 text-[13px] font-[700] text-[#000000B2] text-nowrap">
                          {transaction?.username && transaction?.username !== ""
                            ? transaction?.username
                            : "GUEST"}
                        </td>
                        {/* <td className="p-4 text-nowrap">
                          {transaction?.bankId?.bankName !== "UPI" ? (
                            <div className="">
                              <span className="text-[13px] font-[700] text-black whitespace-nowrap">
                                {transaction?.bankId?.bankName}
                              </span>
                            </div>
                          ) : (
                            <div className="">
                              <p className="text-[13px] font-[700] text-black ">
                                UPI<span className="font-[400]"> - {transaction?.bankId?.iban}</span>
                              </p>
                            </div>
                          )}
                        </td> */}
                        <td className="p-4 text-nowrap">
                          {transaction?.bankId?.accountType === "upi" ? (
                            <div className="">
                              <p className="text-[13px] font-[700] text-black">
                                UPI
                                <span className="font-[400]">
                                  {" "}
                                  - {transaction?.bankId?.iban}
                                </span>
                              </p>
                            </div>
                          ) : transaction?.bankId?.accountType === "crypto" ? (
                            <div className="">
                              <p className="text-[13px] font-[700] text-black">
                                Crypto
                                <span className="font-[400]">
                                  {" "}
                                  - {transaction?.bankId?.iban}
                                </span>
                              </p>
                            </div>
                          ) : (
                            <div className="">
                              <span className="text-[13px] font-[700] text-black whitespace-nowrap">
                                {transaction?.bankId?.bankName}
                                <span className="font-[400]">
                                  {" "}
                                  - {transaction?.bankId?.accountNo}
                                </span>
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-[13px] font-[600] text-[#000000B2]">
                          {transaction?.merchantId?.merchantName}
                        </td>
                        <td className="p-4 text-[13px] font-[700] text-[#000000B2]">
                          {transaction?.bankId?.accountType === "crypto" ? (
                            <div>
                              <span className="text-[#000000B2]">
                                $ {transaction?.dollarAmount}
                              </span>
                              <span className="text-[#000000B2] ml-2">
                                / ₹ {transaction?.total}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <FaIndianRupeeSign className="inline-block mt-[-1px]" />{" "}
                              {transaction?.total}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-[12px] font-[700] text-[#0864E8]">
                          {transaction?.utr}
                        </td>
                        <td className="p-4 text-[13px] font-[500]">
                          <span
                            className={`px-2 py-1 rounded-[20px] text-nowrap text-[11px] font-[600] min-w-20 flex items-center justify-center ${transaction?.status === "Approved"
                              ? "bg-[#10CB0026] text-[#0DA000]"
                              : transaction?.status === "Pending"
                                ? "bg-[#FFC70126] text-[#FFB800]"
                                : transaction?.status === "Manual Verified"
                                  ? "bg-[#0865e851] text-[#0864E8]"
                                  : "bg-[#FF7A8F33] text-[#FF002A]"
                              }`}
                          >
                            {transaction?.status?.charAt(0).toUpperCase() +
                              transaction?.status?.slice(1)}
                          </span>
                        </td>
                        <td className="p-4 flex space-x-2 transaction-view-model">
                          <button
                            className="bg-blue-100 text-blue-600 rounded-full px-2 py-2 mx-2"
                            title="View"
                            onClick={() => handleViewTransaction(transaction)}
                          >
                            <FiEye />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="p-4 text-center text-gray-500">
                        No Transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col md:flex-row items-center p-4 justify-between space-y-4 md:space-y-0">
              <p className="text-[13px] font-[500] text-gray-500 text-center md:text-left"></p>
              <Pagination
                className="self-center md:self-auto"
                current={currentPage}
                onChange={(e) => setCurrentPage(e)}
                defaultCurrent={1}
                total={totalPages * 10}
              />
            </div>
          </div>
        </div>
      </div>
      <Modal
        centered
        footer={null}
        width={1000}
        style={{
          fontFamily: "sans-serif",
          padding: "20px",
          maxWidth: "95vw",
          minHeight: "90vh",
        }}
        bodyStyle={{
          height: "100%",
          overflow: "hidden",
        }}
        title={<p className="text-[20px] font-[700]">Transaction Details</p>}
        open={open}
        onCancel={handleModalClose}
        onClose={handleModalClose}
      >
        {selectedTransaction && (
          <div className="flex flex-col md:flex-row">
            {/* Left side input fields */}
            <div className="flex flex-col gap-2 mt-3 w-full md:w-1/1">
              <p className="font-[500] mt-[-8px] mb-[15px]">
                Transaction Id:{" "}
                <span className="text-gray-500 font-[700]">
                  {selectedTransaction.trnNo}
                </span>
              </p>
              {[
                {
                  label: "Amount:",
                  value: selectedTransaction?.total,
                  isCrypto:
                    selectedTransaction?.bankId?.accountType === "crypto",
                  dollarAmount: selectedTransaction?.dollarAmount,
                },
                {
                  label: "UTR#:",
                  value: selectedTransaction?.utr,
                },
                {
                  label: "Date & Time:",
                  value: `${moment
                    .utc(selectedTransaction?.createdAt)
                    .format("DD MMM YYYY, hh:mm A")}`,
                },
                {
                  label: "Bank Name:",
                  value: selectedTransaction.bankId?.bankName || "UPI",
                },
                {
                  label: "Merchant Name:",
                  value: selectedTransaction.merchantId?.merchantName || "",
                },
              ].map((field, index) => (
                <div className="flex items-center gap-4" key={index}>
                  <p className="text-[12px] font-[600] w-[150px]">
                    {field.label}
                  </p>
                  {field.isTextarea ? (
                    <textarea
                      className="w-[50%] text-[11px] border rounded p-1 resize-none outline-none input-placeholder-black overflow-hidden"
                      value={field.value}
                      rows={3}
                      readOnly
                      style={{
                        overflow: "auto",
                        resize: "none",
                      }}
                    />
                  ) : field.isCrypto ? (
                    <div className="w-[50%] text-[12px] input-placeholder-black bg-gray-200 p-2">
                      <span>$ {field.dollarAmount}</span>
                      <span className="ml-2">/ ₹ {field.value}</span>
                    </div>
                  ) : (
                    <Input
                      prefix={
                        field.label === "Amount:" ? (
                          <FaIndianRupeeSign className="mt-[2px]" />
                        ) : null
                      }
                      className={`w-[50%] text-[12px] input-placeholder-black ${isEdit &&
                        (field.label === "Amount:" || field?.label === "UTR#:")
                        ? "bg-white"
                        : "bg-gray-200"
                        }`}
                      readOnly={
                        isEdit &&
                          (field.label === "Amount:" || field?.label === "UTR#:")
                          ? false
                          : true
                      }
                      value={field?.value}
                      onChange={(e) => {
                        if (field?.label === "Amount:") {
                          setSelectedTransaction((prev) => ({
                            ...prev,
                            total: e.target.value,
                          }));
                        } else {
                          setSelectedTransaction((prev) => ({
                            ...prev,
                            utr: e.target.value,
                          }));
                        }
                      }}
                    />
                  )}
                </div>
              ))}
              {selectedTransaction?.status === "Pending" && editPermission && (
                <div className="flex gap-2 mt-4">
                  <button
                    className="bg-[#03996933] flex text-[#039969] p-2 rounded hover:bg-[#03996950] text-[13px]"
                    onClick={() =>
                      handleTransactionAction(
                        "Approved",
                        selectedTransaction?._id
                      )
                    }
                    disabled={
                      selectedTransaction?.status === "Approved" ||
                      selectedTransaction?.status === "Decline"
                    }
                  >
                    <IoMdCheckmark className="mt-[3px] mr-[6px]" />
                    Approve Transaction
                  </button>
                  <button
                    className={`flex p-2 rounded text-[13px] ${declineButtonClicked
                      ? "bg-[#140e0f33] text-black"
                      : "bg-[#FF405F33] hover:bg-[#FF405F50] text-[#FF3F5F]"
                      }`}
                    onClick={() =>
                      setDeclinedButtonClicked(!declineButtonClicked)
                    }
                    disabled={
                      selectedTransaction?.status === "Approved" ||
                      selectedTransaction?.status === "Decline"
                    }
                  >
                    <GoCircleSlash className="mt-[3px] mr-[6px]" />
                    Decline TR
                  </button>
                </div>
              )}

              {/* Bottom Divider and Activity */}
              <div className="border-b w-[370px] mt-4"></div>


              {selectedTransaction?.trnStatus !== "Transaction Pending" && (
                <div>
                  <div className="flex items-center mt-4">
                    <p className="text-[14px] font-[700] mr-2">
                      Transaction Activity:
                    </p>
                  </div>
                  {/* Update transaction status for admin */}
                  {selectedTransaction?.status !== "Pending" && Cookies.get("type") === "admin" && (
                    <div className="flex flex-col mt-3">
                      <div className="flex items-center gap-3">
                        <p className="text-[14px] font-[700] text-nowrap">
                          Update Status:
                        </p>
                        <Select
                          key={selectedTransaction?._id}
                          style={{ width: 200 }}
                          placeholder="Select new status"
                          value={newStatus}
                          onChange={(value) => {
                            setNewStatus(value);
                            if (value === "Decline") {
                              setDeclinedButtonClicked(true);
                            } else {
                              setDeclinedButtonClicked(false);
                              setSelectedOption(null);
                            }
                          }}
                        >
                          {selectedTransaction?.status === "Approved" ? (
                            <Select.Option value="Decline">
                              Decline
                            </Select.Option>
                          ) : selectedTransaction?.status === "Decline" ? (
                            <Select.Option value="Approved">
                              Approve
                            </Select.Option>
                          ) : null}
                        </Select>
                      </div>
                      {newStatus && newStatus !== "Decline" && (
                        <button
                          className="bg-[#03996933] flex text-[#039969] p-1.5 rounded hover:bg-[#03996950] text-[13px] mt-3 w-fit"
                          onClick={() => {
                            handleTransactionAction(
                              newStatus,
                              selectedTransaction?._id
                            );
                            setNewStatus(null);
                          }}
                        >
                          Update Status
                        </button>
                      )}
                      {newStatus === "Decline" && (
                        <>
                          <p className="text-[14px] font-[700] mt-4">
                            Select Reason for Decline
                          </p>
                          <div className="space-y-2 mt-2">
                            {options.map((option) => (
                              <label
                                key={option}
                                className="flex items-center space-x-3 cursor-pointer rounded-lg"
                              >
                                <input
                                  type="radio"
                                  name="issue"
                                  value={option}
                                  checked={selectedOption === option}
                                  onChange={() => setSelectedOption(option)}
                                  className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {option}
                                </span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-[10px] mt-4">
                            <button
                              className="bg-[#FF405F33] flex text-[#FF3F5F] py-2 px-[20px] rounded hover:bg-[#FF405F50] text-[13px] w-[max-content]"
                              onClick={() => {
                                if (!selectedOption) {
                                  notification.error({
                                    message: "Error",
                                    description: "Please select a reason for decline",
                                    placement: "topRight",
                                  });
                                  return;
                                }
                                handleTransactionAction(
                                  "Decline",
                                  selectedTransaction?._id
                                );
                                setNewStatus(null);
                                setDeclinedButtonClicked(false);
                                setSelectedOption(null);
                              }}
                            >
                              Submit
                            </button>
                            <button
                              className="bg-gray-200 flex text-black py-2 px-[20px] rounded text-[13px] w-[max-content]"
                              onClick={() => {
                                setNewStatus(null);
                                setDeclinedButtonClicked(false);
                                setSelectedOption(null);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <div className="mt-4">
                    <table className="w-[77%] border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 text-center text-[12px] font-[600] border">
                            Date
                          </th>
                          <th className="p-2 text-center text-[12px] font-[600] border text-nowrap">
                            Action By
                          </th>
                          <th className="p-2 text-center text-[12px] font-[600] border">
                            Status
                          </th>
                          <th className="p-2 text-[12px] font-[600] border text-center">
                            Reason
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTransaction?.transactionLogs?.map((log, index) => (
                          <tr key={index}>
                            <td className="p-2 text-[12px] border text-nowrap">
                              {moment(log?.updatedAt)
                                .tz("Asia/Kolkata")
                                .format("DD MMM YYYY, hh:mm A")}
                            </td>
                            <td className="p-2 text-[12px] border">
                              {log?.actionBy || "Admin"}
                            </td>
                            <td className="p-2 text-[12px] border">
                              <span
                                className={`px-2 py-1 rounded-[20px] text-nowrap text-[11px] font-[600] ${log?.status === "Approved"
                                  ? "bg-[#10CB0026] text-[#0DA000]"
                                  : log?.status === "Pending"
                                    ? "bg-[#FFC70126] text-[#FFB800]"
                                    : log?.status === "Manual Verified"
                                      ? "bg-[#0865e851] text-[#0864E8]"
                                      : "bg-[#FF7A8F33] text-[#FF002A]"
                                  }`}
                              >
                                {log?.status}
                              </span>
                            </td>
                            <td className="p-2 text-[12px] border text-nowrap text-center">
                              {log?.reason || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}


            </div>
            {/* Right side with border and image */}
            <div
              className="w-full md:w-2/3 md:border-l my-10 md:mt-0 pl-0 md:pl-6 flex flex-col justify-between items-center h-full"
              style={{ aspectRatio: "1" }}
            >
              <div
                className="relative w-full max-w-[400px] overflow-hidden cursor-zoom-in"
                style={{ aspectRatio: "1" }}
              >
                <img
                  src={`${BACKEND_URL}/${selectedTransaction?.image}`}
                  alt="Payment Proof"
                  className="w-full h-full object-contain"
                  style={{
                    transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                    transform: isHovering ? "scale(2)" : "scale(1)",
                    transition: "transform 0.1s ease-out",
                  }}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  onMouseMove={handleMouseMove}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        title="USDT Exchange Rate"
        width={500}
        open={exchangeRateModal}
        onClose={fn_closeExchangeModal}
        onCancel={fn_closeExchangeModal}
        footer={null}
        style={{ fontFamily: "sans-serif" }}
      >
        <form
          className="flex flex-col gap-[20px] pt-[15px]"
          onSubmit={fn_submitRate}
        >
          <Input addonBefore={<FaDollarSign />} value={1} />
          <Input
            addonBefore={<FaIndianRupeeSign />}
            value={indianRate}
            onChange={(e) => setIndianRate(e.target.value)}
            placeholder="Enter Indian Rate"
          />
          <hr />
          <div className="flex gap-[10px]">
            <Button type="default" className="w-full">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" className="w-full">
              {savedRate ? "Update" : "Submit"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default TransactionsTable;

import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Form, Grid, Input, Typography, notification } from "antd";

import logo from "../../assets/logo.png";
import { fn_loginAdminApi } from "../../api/api";

const { useBreakpoint } = Grid;
const { Text, Title } = Typography;

const Login = ({ authorization, setAuthorization }) => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoader, setLoginLoader] = useState(false);

  useEffect(() => {
    if (authorization) {
      navigate("/");
    }
  }, [authorization, navigate]);

  const onFinish = async (values) => {
    try {
      setLoginLoader(true);
      const response = await fn_loginAdminApi(values);
      console.log("Login Response:", response);
      if (response?.status) {
        notification.success({
          message: "Login Successful",
          description: "You have successfully logged in.",
          placement: "topRight",
        });
        Cookies.set("token", response?.token);
        Cookies.set("adminId", response?.id);
        setAuthorization(true);
        navigate("/");
      } else {
        setLoginLoader(false);
        notification.error({
          message: "Login Failed",
          description: response?.message,
          placement: "topRight",
        });
      }
    } catch (error) {
      console.error("Login Error:", error);
      setLoginLoader(false);
      notification.error({
        message: "Error",
        description: "An unexpected error occurred. Please try again later.",
        placement: "topRight",
      });
    }
  };

  const styles = {
    container: {
      margin: "0 auto",
      padding: screens.md ? "40px" : "30px 15px",
      width: "380px",
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    footer: {
      marginTop: "20px",
      textAlign: "center",
      width: "100%",
    },
    forgotPassword: {
      float: "right",
    },
    header: {
      marginBottom: "30px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
    section: {
      alignItems: "center",
      backgroundColor: "#f5f5f5",
      display: "flex",
      height: screens.sm ? "100vh" : "auto",
      padding: "40px 0",
    },
    text: {
      color: "#6c757d",
    },
    title: {
      fontSize: screens.md ? "24px" : "20px",
      marginTop: "10px",
    },
    logo: {
      width: "80px",
      height: "auto",
    },
  };

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <div style={styles.header}>
          {/* <img src={logo} alt="Logo" style={styles.logo} /> */}
          <Title style={styles.title}>Admin Login</Title>
          <Text style={styles.text}>
            Welcome back! Please enter your details below to log in as an admin.
          </Text>
        </div>
        <Form
          name="admin_login"
          initialValues={{
            remember: true,
          }}
          onFinish={onFinish}
        >
          <Form.Item
            name="email"
            rules={[
              {
                required: true,
                message: "Please input your Email!",
              },
              {
                type: "email",
                message: "Please enter a valid email!",
              },
            ]}
          >
            <Input
              prefix={<MailOutlined className="site-form-item-icon" />}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: "Please input your Password!",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loginLoader}
              style={{ width: "100%" }}
            >
              Log in
            </Button>
          </Form.Item>
        </Form>
      </div>
    </section>
  );
};

export default Login;

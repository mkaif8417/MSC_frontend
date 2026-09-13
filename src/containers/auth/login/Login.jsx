import { useState } from "react";
import { Alert, Button, Form, Input, Typography } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { setLoginUser } from "../../../redux/authslice.jsx";
import { login } from "../../../services/authService";
import styles from "./Login.module.css";

const { Title, Text } = Typography;

// ---------------------------------------------------------
// Left panel: a quiet tessellating geometric pattern (classic
// overlapping-square / 8-point-star construction) with one larger
// version of the same motif behind the logo as the page's single
// deliberate visual moment.
// ---------------------------------------------------------
function GeometricPanel() {
  return (
    <div className={styles.panel}>
      <svg className={styles.patternSvg} preserveAspectRatio="none">
        <defs>
          <pattern
            id="starPattern"
            width="64"
            height="64"
            patternUnits="userSpaceOnUse"
          >
            <g stroke="currentColor" strokeWidth="1" fill="none">
              <rect x="18" y="18" width="28" height="28" />
              <rect
                x="18"
                y="18"
                width="28"
                height="28"
                transform="rotate(45 32 32)"
              />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#starPattern)" />
      </svg>

      <div className={styles.panelContent}>
        <div className={styles.medallionWrap}>
          <svg className={styles.medallion} viewBox="0 0 160 160" fill="none">
            <g stroke="#C9932F" strokeWidth="1.4" opacity="0.9">
              <rect x="30" y="30" width="100" height="100" />
              <rect
                x="30"
                y="30"
                width="100"
                height="100"
                transform="rotate(45 80 80)"
              />
              <circle cx="80" cy="80" r="58" />
            </g>
          </svg>

          <div className={styles.logo}>M</div>
        </div>

        <Title level={2} className={styles.panelTitle}>
          Masjid Study Center
        </Title>

        <Text className={styles.panelSubtitle}>
          Connecting Karnataka's study centers, teachers and students —
          one network, one mission.
        </Text>
      </div>
    </div>
  );
}

function Login() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await login({
        email: values.email,
        password: values.password,
      });

      if (!response?.success) {
        setErrorMessage(
          response?.message || "Unable to login. Please try again."
        );
        return;
      }

      const user = response?.data?.user;

      if (!user) {
        setErrorMessage(
          "Login succeeded but user information was not returned."
        );
        return;
      }

      dispatch(setLoginUser(user));

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(
        error?.message || "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <GeometricPanel />

      <div className={styles.formSide}>
        <div className={styles.formCard}>
          <div className={styles.heading}>
            <Title level={3} className={styles.headingTitle}>
              Welcome back
            </Title>
            <Text type="secondary">Sign in to your account</Text>
          </div>

          {errorMessage && (
            <Alert
              className={styles.alert}
              message={errorMessage}
              type="error"
              showIcon
            />
          )}

          <Form
            layout="vertical"
            size="large"
            onFinish={handleLogin}
            autoComplete="off"
            className={styles.form}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please enter your email." },
                { type: "email", message: "Please enter a valid email." },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Enter your email"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please enter your password." },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
              />
            </Form.Item>

            <div className={styles.forgot}>
              <button type="button" className={styles.forgotButton}>
                Forgot password?
              </button>
            </div>

            <Form.Item className={styles.submitItem}>
              <Button
                htmlType="submit"
                type="primary"
                block
                loading={loading}
                className={styles.loginButton}
              >
                Login
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default Login;
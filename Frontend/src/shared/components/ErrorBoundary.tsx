import { Component, type ErrorInfo, type ReactNode } from "react";
import { Alert, Button, Card, Typography } from "antd";
import { ReloadOutlined, BugOutlined } from "@ant-design/icons";
import { logger } from "../../utils/common/logger";

const { Title, Paragraph, Text } = Typography;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("Error Boundary caught an error:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Custom error handler
    this.props.onError?.(error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: "24px",
            minHeight: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          role="alertdialog"
          aria-live="assertive"
        >
          <Card style={{ maxWidth: "500px", width: "100%" }}>
            <div style={{ textAlign: "center" }}>
              <BugOutlined
                style={{
                  fontSize: "48px",
                  color: "#ff4d4f",
                  marginBottom: "16px",
                }}
                aria-label="Error icon"
              />

              <Title level={3}>Something went wrong</Title>

              <Paragraph type="secondary">
                We're sorry! An unexpected error occurred in the application.
                The error has been logged and our team will investigate.
              </Paragraph>

              <Alert
                message="Error Details"
                description={
                  <div>
                    <Text code>{this.state.error?.message}</Text>
                    {process.env.NODE_ENV === "development" &&
                      this.state.errorInfo && (
                        <details style={{ marginTop: "8px" }}>
                          <summary>Component Stack (Development Only)</summary>
                          <pre
                            style={{
                              fontSize: "12px",
                              background: "#f5f5f5",
                              padding: "8px",
                              borderRadius: "4px",
                              marginTop: "8px",
                              overflow: "auto",
                              maxHeight: "200px",
                            }}
                          >
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </details>
                      )}
                  </div>
                }
                type="error"
                style={{ textAlign: "left", marginBottom: "16px" }}
              />

              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                <Button type="primary" icon={<ReloadOutlined />} onClick={this.handleReload}>
                  Reload Page
                </Button>
                <Button onClick={this.handleReset}>
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

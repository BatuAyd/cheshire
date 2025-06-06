import { useState, useEffect } from "react";

// Types for service status
interface ServiceStatus {
  name: string;
  status: "healthy" | "warning" | "offline";
  responseTime: number | null;
  message: string;
  details?: string;
  icon: string;
}

interface SystemInfo {
  version: string;
  uptime: string;
  timestamp: string;
}

const StatusPage = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<string>("");

  // Check service health and measure response time
  const checkService = async (
    name: string,
    endpoint: string,
    timeout = 5000
  ): Promise<ServiceStatus> => {
    const startTime = Date.now();

    const serviceConfig = {
      "System Information": { icon: "📊" },
      "Auth System": { icon: "🔐" },
      PostgreSQL: { icon: "💾" },
      Redis: { icon: "⚡" },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(endpoint, {
        signal: controller.signal,
        cache: "no-cache",
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      // Handle specific cases for different endpoints
      if (name === "Auth System" && response.status === 401) {
        // 401 for /api/me actually means the auth system is working (but no token provided)
        return {
          name,
          status: "healthy",
          responseTime,
          message: "JWT authentication operational",
          icon: serviceConfig[name as keyof typeof serviceConfig].icon,
        };
      }

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        return {
          name,
          status: "offline",
          responseTime,
          message: "Service unavailable",
          details: errorData.error || `HTTP ${response.status}`,
          icon: serviceConfig[name as keyof typeof serviceConfig].icon,
        };
      }

      const data = await response.json();

      // Determine status based on response time and service-specific logic
      let status: "healthy" | "warning" | "offline" = "healthy";
      let message = "All systems operational";

      if (responseTime > 1000) {
        status = "warning";
        message = "Slow response detected";
      }

      // Service-specific status checks
      if (name === "PostgreSQL" && data.services?.supabase === false) {
        status = "offline";
        message = "Database connection failed";
      } else if (
        name === "Redis" &&
        data.services?.redis?.connected === false
      ) {
        status = "warning";
        message = "Redis disconnected";
      }

      return {
        name,
        status,
        responseTime,
        message,
        details: data.error || undefined,
        icon: serviceConfig[name as keyof typeof serviceConfig].icon,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      let details = "";
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          details = "Request timeout - Check server connection";
        } else if (error.message.includes("fetch")) {
          details = "Network error - Server may be offline";
        } else {
          details = error.message;
        }
      }

      // Service-specific troubleshooting
      if (name === "PostgreSQL") {
        details += " - Check SUPABASE_URL and SUPABASE_SERVICE_KEY";
      } else if (name === "Redis") {
        details += " - Check Redis configuration in .env";
      } else if (name === "Auth System") {
        details += " - Server may be down";
      }

      return {
        name,
        status: "offline",
        responseTime: responseTime < timeout ? responseTime : null,
        message: "Service offline",
        details,
        icon: serviceConfig[name as keyof typeof serviceConfig].icon,
      };
    }
  };

  // Load system information and check all services
  const checkAllServices = async () => {
    setLoading(true);
    setLastChecked(new Date().toLocaleTimeString());

    try {
      // Create system info as a service for consistent 2x2 grid
      const systemInfoService: ServiceStatus = {
        name: "System Information",
        status: "healthy",
        responseTime: null,
        message: "Development environment",
        icon: "📊",
      };

      // Check other services in parallel
      const [authStatus, postgresStatus, redisStatus] = await Promise.all([
        checkService("Auth System", "http://localhost:8080/api/me"),
        checkService("PostgreSQL", "http://localhost:8080/api/status"),
        checkService("Redis", "http://localhost:8080/api/debug/redis"),
      ]);

      setServices([systemInfoService, authStatus, postgresStatus, redisStatus]);

      // Get system information
      try {
        const statusResponse = await fetch("http://localhost:8080/api/status");
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setSystemInfo({
            version: statusData.version || "Unknown",
            uptime: statusData.uptime || "Unknown",
            timestamp: statusData.timestamp || new Date().toISOString(),
          });
        }
      } catch (error) {
        setSystemInfo({
          version: "Unknown",
          uptime: "Unknown",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to check services:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    checkAllServices();
  }, []);

  // Get status pill styling (like Proposal cards)
  const getStatusPill = (status: "healthy" | "warning" | "offline") => {
    switch (status) {
      case "healthy":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          label: "Healthy",
        };
      case "warning":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          label: "Warning",
        };
      case "offline":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          label: "Offline",
        };
    }
  };

  return (
    <div className="min-h-[80vh] px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">
            System Status
          </h1>
          <p className="text-neutral-600 mb-4">
            Real time health monitoring of all system components
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-neutral-500">
            <span>Last checked: {lastChecked}</span>
            <button
              onClick={checkAllServices}
              disabled={loading}
              className="px-3 py-1 bg-orange-400 text-white rounded-lg hover:bg-orange-500 transition-colors disabled:opacity-50"
            >
              {loading ? "Checking..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* 2x2 Grid of Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {services.map((service) => {
            const statusPill = getStatusPill(service.status);

            return (
              <div
                key={service.name}
                className="bg-white rounded-xl shadow-md border border-neutral-200 p-6 hover:shadow-lg transition-shadow relative overflow-hidden"
              >
                {/* Status Pill (top-right, like Proposal cards) */}
                <div className="absolute top-0 right-0">
                  <div
                    className={`px-3 py-1 rounded-bl-lg rounded-tr-xl text-xs font-medium ${statusPill.bg} ${statusPill.text}`}
                  >
                    {statusPill.label}
                  </div>
                </div>

                {/* Service Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-2xl">{service.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-800">
                      {service.name}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {service.message}
                    </p>
                  </div>
                </div>

                {/* Service Details */}
                <div className="space-y-3">
                  {/* Response Time */}
                  {service.responseTime !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-500">
                        Response Time
                      </span>
                      <span className="font-mono text-sm text-neutral-800">
                        {service.responseTime}ms
                      </span>
                    </div>
                  )}

                  {/* System Information specific details */}
                  {service.name === "System Information" && systemInfo && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-500">
                          Version
                        </span>
                        <span className="font-mono text-sm text-neutral-800">
                          {systemInfo.version}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-500">Uptime</span>
                        <span className="font-mono text-sm text-neutral-800">
                          {systemInfo.uptime}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Error Details */}
                  {service.details && (
                    <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">
                        Error Details:
                      </p>
                      <p className="text-sm text-neutral-700 font-mono break-words">
                        {service.details}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatusPage;

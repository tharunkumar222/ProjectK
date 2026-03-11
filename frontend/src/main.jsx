import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import "./styles.css";

function normalizeApiBaseUrl(value) {
  const fallbackUrl = "http://localhost:5000/api";
  const resolvedValue = String(value || fallbackUrl).trim().replace(/\/+$/, "");

  return /\/api$/i.test(resolvedValue)
    ? resolvedValue
    : `${resolvedValue}/api`;
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
const AUTH_STORAGE_KEY = "livwell-auth";

const initialSignupState = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  role: "student",
  hostelName: ""
};

const initialLoginState = {
  email: "",
  password: "",
  role: "student"
};

const initialComplaintState = {
  title: "",
  description: "",
  category: "other",
  priority: "medium"
};

const initialLaundryState = {
  itemCount: 1,
  serviceType: "wash",
  pickupDate: "",
  deliveryDate: "",
  amount: "",
  notes: ""
};

const initialAnnouncementState = {
  title: "",
  body: "",
  type: "general",
  audience: "all"
};

const initialRoomState = {
  roomNumber: "",
  block: "",
  floor: "",
  capacity: 2,
  rent: "",
  amenities: "",
  status: "available"
};

const initialMenuState = {
  day: "Monday",
  mealType: "breakfast",
  items: "",
  notes: ""
};

const STUDENT_TABS = [
  { id: "overview", label: "Overview" },
  { id: "complaints", label: "Complaints" },
  { id: "payments", label: "Payments" },
  { id: "community", label: "Community" },
  { id: "laundry", label: "Laundry" }
];

const OWNER_TABS = [
  { id: "overview", label: "Overview" },
  { id: "students", label: "Students" },
  { id: "rooms", label: "Rooms" },
  { id: "complaints", label: "Complaints" },
  { id: "payments", label: "Payments" },
  { id: "announcements", label: "Announcements" }
];

const COMPLAINT_STATUS_OPTIONS = ["pending", "in progress", "resolved"];
const PAYMENT_STATUS_OPTIONS = [
  "pending",
  "under review",
  "verified",
  "rejected"
];
const ROOM_STATUS_OPTIONS = ["available", "occupied", "maintenance"];
const MEAL_TYPE_ORDER = ["breakfast", "lunch", "snacks", "dinner"];
const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];
const CHART_COLORS = ["#0f766e", "#ea580c", "#2563eb", "#dc2626"];

function readStoredAuth() {
  try {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    return storedAuth ? JSON.parse(storedAuth) : null;
  } catch {
    return null;
  }
}

function persistAuth(authPayload) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authPayload));
}

function clearPersistedAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

function formatDate(value, options = {}) {
  if (!value) {
    return "Not set";
  }

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      ...options
    }).format(new Date(value));
  } catch {
    return "Not set";
  }
}

function formatCurrency(value) {
  const numericValue = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(numericValue);
}

function toNumberOrUndefined(value) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function splitCommaList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getDayIndex(day) {
  const index = DAY_ORDER.indexOf(String(day || "").trim().toLowerCase());
  return index === -1 ? DAY_ORDER.length : index;
}

function sortMenu(menu) {
  return [...(menu || [])].sort((left, right) => {
    const dayDifference = getDayIndex(left.day) - getDayIndex(right.day);
    if (dayDifference !== 0) {
      return dayDifference;
    }

    const mealDifference =
      MEAL_TYPE_ORDER.indexOf(left.mealType) -
      MEAL_TYPE_ORDER.indexOf(right.mealType);

    if (mealDifference !== 0) {
      return mealDifference;
    }

    return String(left.day || "").localeCompare(String(right.day || ""));
  });
}

function slugifyStatus(value) {
  return String(value || "neutral")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatRoomLabel(room) {
  if (!room) {
    return "Unassigned";
  }

  const blockLabel = room.block ? `, ${room.block}` : "";
  return `${room.roomNumber}${blockLabel}`;
}

function getAssetUrl(path) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${ASSET_BASE_URL}${path}`;
}

async function apiRequest(token, config) {
  const response = await axios({
    baseURL: API_BASE_URL,
    ...config,
    headers: {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
}

function App() {
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [signupForm, setSignupForm] = useState(initialSignupState);
  const [auth, setAuth] = useState(readStoredAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  };

  const handleSignupChange = (event) => {
    const { name, value } = event.target;
    setSignupForm((current) => ({ ...current, [name]: value }));
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, loginForm, {
        headers: { "Content-Type": "application/json" }
      });

      const authPayload = {
        token: response.data.token,
        user: response.data.user
      };

      persistAuth(authPayload);
      setAuth(authPayload);
      setSuccessMessage("Logged in successfully.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = {
        ...signupForm,
        hostelName:
          signupForm.role === "owner" ? signupForm.hostelName.trim() : ""
      };

      const response = await axios.post(`${API_BASE_URL}/auth/signup`, payload, {
        headers: { "Content-Type": "application/json" }
      });

      const authPayload = {
        token: response.data.token,
        user: response.data.user
      };

      persistAuth(authPayload);
      setAuth(authPayload);
      setSignupForm(initialSignupState);
      setSuccessMessage("Account created successfully.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearPersistedAuth();
    setAuth(null);
    setSuccessMessage("");
    setError("");
  };

  if (auth?.token && auth?.user) {
    return (
      <DashboardApp auth={auth} setAuth={setAuth} onLogout={handleLogout} />
    );
  }

  return (
    <AuthScreen
      mode={mode}
      setMode={setMode}
      loginForm={loginForm}
      signupForm={signupForm}
      loading={loading}
      error={error}
      successMessage={successMessage}
      onLoginChange={handleLoginChange}
      onSignupChange={handleSignupChange}
      onLoginSubmit={handleLoginSubmit}
      onSignupSubmit={handleSignupSubmit}
    />
  );
}

function AuthScreen({
  mode,
  setMode,
  loginForm,
  signupForm,
  loading,
  error,
  successMessage,
  onLoginChange,
  onSignupChange,
  onLoginSubmit,
  onSignupSubmit
}) {
  const activeRole = mode === "login" ? loginForm.role : signupForm.role;

  return (
    <main className="auth-page">
      <section className="auth-shell auth-shell-compact">
        <section className="auth-card">
          <div className="auth-card-header">
            <p className="eyebrow">Access</p>
            <h2>{mode === "login" ? "Sign in to continue" : "Create account"}</h2>
            <p>
              Use the same workspace for both student and owner flows. Role
              selection controls the dashboard you land on.
            </p>
          </div>

          <div className="mode-switch">
            <button
              type="button"
              className={classNames(
                "switch-button",
                mode === "login" && "switch-button-active"
              )}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={classNames(
                "switch-button",
                mode === "signup" && "switch-button-active"
              )}
              onClick={() => setMode("signup")}
            >
              Sign up
            </button>
          </div>

          <div className="segmented-switch">
            {["student", "owner"].map((role) => (
              <button
                key={role}
                type="button"
                className={classNames(
                  "chip-button",
                  activeRole === role && "chip-button-active"
                )}
                onClick={() => {
                  if (mode === "login") {
                    onLoginChange({ target: { name: "role", value: role } });
                  } else {
                    onSignupChange({ target: { name: "role", value: role } });
                  }
                }}
              >
                {role}
              </button>
            ))}
          </div>

          {error ? <Banner tone="error" message={error} /> : null}
          {successMessage ? (
            <Banner tone="success" message={successMessage} />
          ) : null}

          {mode === "login" ? (
            <form className="stack-form" onSubmit={onLoginSubmit}>
              <Field label="Email">
                <input
                  className="input"
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={onLoginChange}
                  placeholder="you@example.com"
                  required
                />
              </Field>

              <Field label="Password">
                <input
                  className="input"
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={onLoginChange}
                  placeholder="Enter password"
                  required
                />
              </Field>

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
          ) : (
            <form className="stack-form" onSubmit={onSignupSubmit}>
              <Field label="Full name">
                <input
                  className="input"
                  type="text"
                  name="fullName"
                  value={signupForm.fullName}
                  onChange={onSignupChange}
                  placeholder="Your full name"
                  required
                />
              </Field>

              <Field label="Email">
                <input
                  className="input"
                  type="email"
                  name="email"
                  value={signupForm.email}
                  onChange={onSignupChange}
                  placeholder="you@example.com"
                  required
                />
              </Field>

              <Field label="Phone">
                <input
                  className="input"
                  type="tel"
                  name="phone"
                  value={signupForm.phone}
                  onChange={onSignupChange}
                  placeholder="+91 98765 43210"
                />
              </Field>

              {signupForm.role === "owner" ? (
                <Field label="Hostel name">
                  <input
                    className="input"
                    type="text"
                    name="hostelName"
                    value={signupForm.hostelName}
                    onChange={onSignupChange}
                    placeholder="LivWell Residency"
                  />
                </Field>
              ) : null}

              <Field label="Password">
                <input
                  className="input"
                  type="password"
                  name="password"
                  value={signupForm.password}
                  onChange={onSignupChange}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                />
              </Field>

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}

function DashboardApp({ auth, setAuth, onLogout }) {
  const role = auth.user.role;
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [busyKey, setBusyKey] = useState("");

  const [complaintForm, setComplaintForm] = useState(initialComplaintState);
  const [laundryForm, setLaundryForm] = useState(initialLaundryState);
  const [announcementForm, setAnnouncementForm] = useState(
    initialAnnouncementState
  );
  const [roomForm, setRoomForm] = useState(initialRoomState);
  const [menuForm, setMenuForm] = useState(initialMenuState);

  const [studentDrafts, setStudentDrafts] = useState({});
  const [roomDrafts, setRoomDrafts] = useState({});
  const [complaintDrafts, setComplaintDrafts] = useState({});
  const [paymentDrafts, setPaymentDrafts] = useState({});

  useEffect(() => {
    setActiveTab("overview");
  }, [role]);

  const loadDashboard = async ({ silent = false } = {}) => {
    if (!auth?.token) {
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    setError("");

    try {
      let nextData;

      if (role === "student") {
        const [
          userResponse,
          overviewResponse,
          complaintsResponse,
          paymentsResponse,
          announcementsResponse,
          menuResponse,
          laundryResponse
        ] = await Promise.all([
          apiRequest(auth.token, { method: "get", url: "/users/getUser" }),
          apiRequest(auth.token, { method: "get", url: "/complaints/overview" }),
          apiRequest(auth.token, { method: "get", url: "/complaints/get" }),
          apiRequest(auth.token, { method: "get", url: "/payments/get" }),
          apiRequest(auth.token, { method: "get", url: "/announcements/get" }),
          apiRequest(auth.token, { method: "get", url: "/food-menu/get" }),
          apiRequest(auth.token, { method: "get", url: "/laundry/get" })
        ]);

        nextData = {
          user: userResponse.user,
          overview: overviewResponse.overview,
          complaints: complaintsResponse.complaints,
          payments: paymentsResponse.payments,
          announcements: announcementsResponse.announcements,
          menu: sortMenu(menuResponse.menu),
          laundryRequests: laundryResponse.laundryRequests
        };
      } else {
        const [
          userResponse,
          analyticsResponse,
          studentsResponse,
          roomsResponse,
          complaintsResponse,
          paymentsResponse,
          announcementsResponse,
          menuResponse
        ] = await Promise.all([
          apiRequest(auth.token, { method: "get", url: "/users/getUser" }),
          apiRequest(auth.token, { method: "get", url: "/users/analytics" }),
          apiRequest(auth.token, { method: "get", url: "/users/students" }),
          apiRequest(auth.token, { method: "get", url: "/rooms/get" }),
          apiRequest(auth.token, { method: "get", url: "/complaints/get" }),
          apiRequest(auth.token, { method: "get", url: "/payments/get" }),
          apiRequest(auth.token, { method: "get", url: "/announcements/get" }),
          apiRequest(auth.token, { method: "get", url: "/food-menu/get" })
        ]);

        nextData = {
          user: userResponse.user,
          analytics: analyticsResponse.analytics,
          students: studentsResponse.students,
          rooms: roomsResponse.rooms,
          complaints: complaintsResponse.complaints,
          payments: paymentsResponse.payments,
          announcements: announcementsResponse.announcements,
          menu: sortMenu(menuResponse.menu)
        };
      }

      setData(nextData);

      const refreshedAuth = {
        token: auth.token,
        user: nextData.user
      };

      persistAuth(refreshedAuth);
      setAuth(refreshedAuth);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        onLogout();
        return;
      }

      setError(getErrorMessage(requestError));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [auth?.token, role]);

  useEffect(() => {
    if (role !== "owner" || !data) {
      return;
    }

    const nextStudentDrafts = {};
    data.students.forEach((student) => {
      nextStudentDrafts[student._id] = {
        fullName: student.fullName || "",
        phone: student.phone || "",
        emergencyContact: student.emergencyContact || "",
        room: student.room?._id || ""
      };
    });
    setStudentDrafts(nextStudentDrafts);

    const nextRoomDrafts = {};
    data.rooms.forEach((room) => {
      nextRoomDrafts[room._id] = {
        roomNumber: room.roomNumber || "",
        block: room.block || "",
        floor: room.floor || "",
        capacity: String(room.capacity ?? 2),
        rent: room.rent ?? "",
        amenities: (room.amenities || []).join(", "),
        status: room.status || "available"
      };
    });
    setRoomDrafts(nextRoomDrafts);

    const nextComplaintDrafts = {};
    data.complaints.forEach((complaint) => {
      nextComplaintDrafts[complaint._id] = {
        status: complaint.status || "pending",
        resolutionNote: complaint.resolutionNote || ""
      };
    });
    setComplaintDrafts(nextComplaintDrafts);

    const nextPaymentDrafts = {};
    data.payments.forEach((payment) => {
      nextPaymentDrafts[payment._id] = {
        status: payment.status || "pending",
        notes: payment.notes || ""
      };
    });
    setPaymentDrafts(nextPaymentDrafts);
  }, [data, role]);

  const performAction = async (key, action, successMessage) => {
    setBusyKey(key);
    setNotice(null);

    try {
      await action();
      if (successMessage) {
        setNotice({ tone: "success", message: successMessage });
      }
      await loadDashboard({ silent: true });
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        onLogout();
        return;
      }

      setNotice({ tone: "error", message: getErrorMessage(requestError) });
    } finally {
      setBusyKey("");
    }
  };

  const refreshData = () => {
    setNotice(null);
    loadDashboard();
  };

  const userName = data?.user?.fullName || auth.user.fullName;

  return (
    <main className="dashboard-page">
      <section className="dashboard-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">LivWell</p>
            <h1 className="dashboard-title">
              {role === "student" ? "Student Dashboard" : "Owner Dashboard"}
            </h1>
            <p className="topbar-copy">
              {role === "student"
                ? "Room details, complaints, payments, notices, food menu, and laundry status in one place."
                : "Manage students, rooms, complaints, payments, announcements, and occupancy performance."}
            </p>
          </div>

          <div className="topbar-actions">
            <div className="identity-card">
              <strong>{userName}</strong>
              <span>{auth.user.email}</span>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={refreshData}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {notice ? <Banner tone={notice.tone} message={notice.message} /> : null}
        {error ? <Banner tone="error" message={error} /> : null}

        {loading && !data ? (
          <section className="panel loading-panel">
            <p className="eyebrow">Loading</p>
            <h2>Fetching dashboard data</h2>
            <p>Waiting for complaints, rooms, payments, and announcements.</p>
          </section>
        ) : null}

        {!loading && !data ? (
          <section className="panel loading-panel">
            <p className="eyebrow">Unavailable</p>
            <h2>Dashboard data could not be loaded</h2>
            <p>Check the backend connection and try again.</p>
            <button type="button" className="primary-button" onClick={refreshData}>
              Retry
            </button>
          </section>
        ) : null}

        {data && role === "student" ? (
          <StudentDashboard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            data={data}
            complaintForm={complaintForm}
            setComplaintForm={setComplaintForm}
            laundryForm={laundryForm}
            setLaundryForm={setLaundryForm}
            onCreateComplaint={(event) => {
              event.preventDefault();
              performAction(
                "create-complaint",
                async () => {
                  await apiRequest(auth.token, {
                    method: "post",
                    url: "/complaints/create",
                    data: complaintForm
                  });
                  setComplaintForm(initialComplaintState);
                },
                "Complaint raised successfully."
              );
            }}
            onCreateLaundryRequest={(event) => {
              event.preventDefault();
              performAction(
                "create-laundry",
                async () => {
                  await apiRequest(auth.token, {
                    method: "post",
                    url: "/laundry/create",
                    data: {
                      itemCount: Number(laundryForm.itemCount),
                      serviceType: laundryForm.serviceType,
                      pickupDate: laundryForm.pickupDate || undefined,
                      deliveryDate: laundryForm.deliveryDate || undefined,
                      amount: toNumberOrUndefined(laundryForm.amount),
                      notes: laundryForm.notes.trim() || undefined
                    }
                  });
                  setLaundryForm(initialLaundryState);
                },
                "Laundry request submitted."
              );
            }}
            busyKey={busyKey}
          />
        ) : null}

        {data && role === "owner" ? (
          <OwnerDashboard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            data={data}
            studentDrafts={studentDrafts}
            setStudentDrafts={setStudentDrafts}
            roomDrafts={roomDrafts}
            setRoomDrafts={setRoomDrafts}
            complaintDrafts={complaintDrafts}
            setComplaintDrafts={setComplaintDrafts}
            paymentDrafts={paymentDrafts}
            setPaymentDrafts={setPaymentDrafts}
            announcementForm={announcementForm}
            setAnnouncementForm={setAnnouncementForm}
            roomForm={roomForm}
            setRoomForm={setRoomForm}
            menuForm={menuForm}
            setMenuForm={setMenuForm}
            onSaveStudent={(studentId) => {
              performAction(
                `student-${studentId}`,
                async () => {
                  const draft = studentDrafts[studentId];
                  await apiRequest(auth.token, {
                    method: "put",
                    url: `/users/students/${studentId}`,
                    data: {
                      fullName: draft.fullName.trim(),
                      phone: draft.phone.trim(),
                      emergencyContact: draft.emergencyContact.trim(),
                      room: draft.room
                    }
                  });
                },
                "Student updated."
              );
            }}
            onCreateRoom={(event) => {
              event.preventDefault();
              performAction(
                "create-room",
                async () => {
                  await apiRequest(auth.token, {
                    method: "post",
                    url: "/rooms/create",
                    data: {
                      roomNumber: roomForm.roomNumber.trim(),
                      block: roomForm.block.trim() || undefined,
                      floor: roomForm.floor.trim() || undefined,
                      capacity: Number(roomForm.capacity) || 2,
                      rent: toNumberOrUndefined(roomForm.rent),
                      amenities: splitCommaList(roomForm.amenities),
                      status: roomForm.status
                    }
                  });
                  setRoomForm(initialRoomState);
                },
                "Room created."
              );
            }}
            onSaveRoom={(roomId) => {
              performAction(
                `room-${roomId}`,
                async () => {
                  const draft = roomDrafts[roomId];
                  await apiRequest(auth.token, {
                    method: "put",
                    url: `/rooms/update/${roomId}`,
                    data: {
                      roomNumber: draft.roomNumber.trim(),
                      block: draft.block.trim() || undefined,
                      floor: draft.floor.trim() || undefined,
                      capacity: Number(draft.capacity) || 2,
                      rent: toNumberOrUndefined(draft.rent),
                      amenities: splitCommaList(draft.amenities),
                      status: draft.status
                    }
                  });
                },
                "Room updated."
              );
            }}
            onSaveComplaint={(complaintId) => {
              performAction(
                `complaint-${complaintId}`,
                async () => {
                  const draft = complaintDrafts[complaintId];
                  await apiRequest(auth.token, {
                    method: "put",
                    url: `/complaints/updateStatus/${complaintId}`,
                    data: {
                      status: draft.status,
                      resolutionNote: draft.resolutionNote.trim()
                    }
                  });
                },
                "Complaint status updated."
              );
            }}
            onSavePayment={(paymentId) => {
              performAction(
                `payment-${paymentId}`,
                async () => {
                  const draft = paymentDrafts[paymentId];
                  await apiRequest(auth.token, {
                    method: "put",
                    url: `/payments/verify/${paymentId}`,
                    data: {
                      status: draft.status,
                      notes: draft.notes.trim()
                    }
                  });
                },
                "Payment status updated."
              );
            }}
            onCreateAnnouncement={(event) => {
              event.preventDefault();
              performAction(
                "create-announcement",
                async () => {
                  await apiRequest(auth.token, {
                    method: "post",
                    url: "/announcements/create",
                    data: {
                      title: announcementForm.title.trim(),
                      body: announcementForm.body.trim(),
                      type: announcementForm.type,
                      audience: announcementForm.audience
                    }
                  });
                  setAnnouncementForm(initialAnnouncementState);
                },
                "Announcement published."
              );
            }}
            onCreateMenuItem={(event) => {
              event.preventDefault();
              performAction(
                "create-menu",
                async () => {
                  await apiRequest(auth.token, {
                    method: "post",
                    url: "/food-menu/create",
                    data: {
                      day: menuForm.day.trim(),
                      mealType: menuForm.mealType,
                      items: splitCommaList(menuForm.items),
                      notes: menuForm.notes.trim() || undefined
                    }
                  });
                  setMenuForm(initialMenuState);
                },
                "Food menu updated."
              );
            }}
            busyKey={busyKey}
          />
        ) : null}
      </section>
    </main>
  );
}

function StudentDashboard({
  activeTab,
  setActiveTab,
  data,
  complaintForm,
  setComplaintForm,
  laundryForm,
  setLaundryForm,
  onCreateComplaint,
  onCreateLaundryRequest,
  busyKey
}) {
  const room = data.user.room || data.overview?.student?.room;
  const openComplaints = data.complaints.filter(
    (complaint) => complaint.status !== "resolved"
  ).length;
  const pendingPayments = data.payments.filter(
    (payment) => payment.status !== "verified"
  ).length;
  const activeLaundry = data.laundryRequests.filter(
    (request) => request.status !== "delivered"
  ).length;

  const groupedMenu = {};
  data.menu.forEach((item) => {
    if (!groupedMenu[item.day]) {
      groupedMenu[item.day] = [];
    }
    groupedMenu[item.day].push(item);
  });

  return (
    <>
      <section className="hero-grid">
        <Panel
          eyebrow="Live"
          title={`Welcome back, ${data.user.fullName.split(" ")[0]}`}
          subtitle="Track your room, service requests, payments, and campus notices without switching views."
          className="hero-panel"
        >
          <div className="metric-strip">
            <MetricCard
              label="Room"
              value={room ? formatRoomLabel(room) : "Pending"}
              helper={
                room
                  ? `${room.occupants?.length || 0}/${room.capacity || 2} beds occupied`
                  : "No room assigned yet"
              }
            />
            <MetricCard
              label="Open complaints"
              value={openComplaints}
              helper="Unresolved maintenance tickets"
            />
            <MetricCard
              label="Pending payments"
              value={pendingPayments}
              helper="Entries awaiting verification"
            />
            <MetricCard
              label="Laundry jobs"
              value={activeLaundry}
              helper="Requests still in progress"
            />
          </div>
        </Panel>

        <Panel
          eyebrow="Room"
          title={room ? `Room ${room.roomNumber}` : "Room assignment pending"}
          subtitle={
            room
              ? `${room.block || "Main block"}${room.floor ? `, Floor ${room.floor}` : ""}`
              : "Management has not assigned your room yet."
          }
          className="compact-panel"
        >
          <div className="detail-stack">
            <DetailRow label="Capacity" value={room ? `${room.capacity} beds` : "TBD"} />
            <DetailRow
              label="Status"
              value={room ? <StatusBadge value={room.status} /> : "Awaiting update"}
            />
            <DetailRow
              label="Rent"
              value={room?.rent ? formatCurrency(room.rent) : "Not listed"}
            />
            <DetailRow
              label="Amenities"
              value={
                room?.amenities?.length ? room.amenities.join(", ") : "Not specified"
              }
            />
          </div>
        </Panel>
      </section>

      <TabBar
        tabs={STUDENT_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "overview" ? (
        <section className="dashboard-grid two-column">
          <Panel
            eyebrow="Recent"
            title="Complaint tracker"
            subtitle="Your latest issues and their current state."
          >
            {data.overview?.recentComplaints?.length ? (
              <div className="list-stack">
                {data.overview.recentComplaints.map((complaint) => (
                  <article key={complaint._id} className="list-card">
                    <div className="list-card-header">
                      <div>
                        <h3>{complaint.title}</h3>
                        <p>
                          {complaint.category} · {complaint.priority} priority
                        </p>
                      </div>
                      <StatusBadge value={complaint.status} />
                    </div>
                    <p>{complaint.description}</p>
                    <small>Raised on {formatDate(complaint.createdAt)}</small>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No complaints yet"
                description="Raise your first maintenance issue from the complaints tab."
              />
            )}
          </Panel>

          <Panel
            eyebrow="Notices"
            title="Latest announcements"
            subtitle="Broadcasts from the owner dashboard."
          >
            {data.announcements.length ? (
              <div className="list-stack">
                {data.announcements.slice(0, 4).map((announcement) => (
                  <article key={announcement._id} className="list-card">
                    <div className="list-card-header">
                      <div>
                        <h3>{announcement.title}</h3>
                        <p>
                          {announcement.createdBy?.fullName || "Management"} ·{" "}
                          {formatDate(announcement.createdAt)}
                        </p>
                      </div>
                      <StatusBadge value={announcement.type} />
                    </div>
                    <p>{announcement.body}</p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No announcements"
                description="Updates from management will appear here."
              />
            )}
          </Panel>

          <Panel
            eyebrow="Payments"
            title="Payment history"
            subtitle="Track hostel dues and verification state."
          >
            {data.payments.length ? (
              <div className="list-stack">
                {data.payments.slice(0, 5).map((payment) => (
                  <article key={payment._id} className="list-card">
                    <div className="list-card-header">
                      <div>
                        <h3>{payment.monthLabel || "Hostel payment"}</h3>
                        <p>
                          {formatCurrency(payment.amount)} · {payment.method}
                        </p>
                      </div>
                      <StatusBadge value={payment.status} />
                    </div>
                    <p>
                      Due {formatDate(payment.dueDate)} · Paid {formatDate(payment.paidAt)}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No payment records"
                description="Payment history will appear once entries are created."
              />
            )}
          </Panel>

          <Panel
            eyebrow="Mess"
            title="Food menu snapshot"
            subtitle="Latest meals scheduled by the hostel team."
          >
            {data.menu.length ? (
              <div className="list-stack">
                {data.menu.slice(0, 5).map((item) => (
                  <article key={item._id} className="list-card">
                    <div className="list-card-header">
                      <div>
                        <h3>
                          {item.day} · {item.mealType}
                        </h3>
                        <p>{item.items.join(", ")}</p>
                      </div>
                    </div>
                    <p>{item.notes || "No notes added."}</p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Menu not published"
                description="Meal updates will appear here once management adds them."
              />
            )}
          </Panel>
        </section>
      ) : null}

      {activeTab === "complaints" ? (
        <section className="dashboard-grid two-column">
          <Panel
            eyebrow="Create"
            title="Raise a complaint"
            subtitle="Capture category, priority, and a clear description so the owner can act quickly."
          >
            <form className="stack-form" onSubmit={onCreateComplaint}>
              <Field label="Issue title">
                <input
                  className="input"
                  type="text"
                  value={complaintForm.title}
                  onChange={(event) =>
                    setComplaintForm((current) => ({
                      ...current,
                      title: event.target.value
                    }))
                  }
                  placeholder="Wi-Fi outage in room"
                  required
                />
              </Field>

              <div className="form-grid">
                <Field label="Category">
                  <select
                    className="input"
                    value={complaintForm.category}
                    onChange={(event) =>
                      setComplaintForm((current) => ({
                        ...current,
                        category: event.target.value
                      }))
                    }
                  >
                    <option value="electricity">Electricity</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="wifi">Wi-Fi</option>
                    <option value="food">Food</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="other">Other</option>
                  </select>
                </Field>

                <Field label="Priority">
                  <select
                    className="input"
                    value={complaintForm.priority}
                    onChange={(event) =>
                      setComplaintForm((current) => ({
                        ...current,
                        priority: event.target.value
                      }))
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  className="input textarea"
                  value={complaintForm.description}
                  onChange={(event) =>
                    setComplaintForm((current) => ({
                      ...current,
                      description: event.target.value
                    }))
                  }
                  placeholder="Describe the issue with enough detail for the owner to reproduce it."
                  required
                />
              </Field>

              <button
                type="submit"
                className="primary-button"
                disabled={busyKey === "create-complaint"}
              >
                {busyKey === "create-complaint"
                  ? "Submitting..."
                  : "Submit complaint"}
              </button>
            </form>
          </Panel>

          <Panel
            eyebrow="Track"
            title="Complaint status"
            subtitle="Every complaint you have raised, newest first."
          >
            {data.complaints.length ? (
              <div className="list-stack">
                {data.complaints.map((complaint) => (
                  <article key={complaint._id} className="list-card">
                    <div className="list-card-header">
                      <div>
                        <h3>{complaint.title}</h3>
                        <p>
                          {complaint.category} · {complaint.priority} priority
                        </p>
                      </div>
                      <StatusBadge value={complaint.status} />
                    </div>
                    <p>{complaint.description}</p>
                    <div className="meta-row">
                      <small>Raised {formatDate(complaint.createdAt)}</small>
                      <small>Room {formatRoomLabel(complaint.room)}</small>
                    </div>
                    {complaint.resolutionNote ? (
                      <div className="callout">
                        <strong>Resolution note</strong>
                        <p>{complaint.resolutionNote}</p>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No complaints raised"
                description="Create one from the form to start the workflow."
              />
            )}
          </Panel>
        </section>
      ) : null}

      {activeTab === "payments" ? (
        <section className="dashboard-grid">
          <Panel
            eyebrow="Ledger"
            title="Payment history"
            subtitle="Payment records and verification details."
          >
            {data.payments.length ? (
              <div className="list-stack">
                {data.payments.map((payment) => (
                  <article key={payment._id} className="list-card">
                    <div className="list-card-header">
                      <div>
                        <h3>{payment.monthLabel || "Hostel payment"}</h3>
                        <p>
                          {formatCurrency(payment.amount)} · {payment.method}
                        </p>
                      </div>
                      <StatusBadge value={payment.status} />
                    </div>
                    <div className="detail-stack">
                      <DetailRow label="Due date" value={formatDate(payment.dueDate)} />
                      <DetailRow label="Paid at" value={formatDate(payment.paidAt)} />
                      <DetailRow
                        label="Verified by"
                        value={payment.verifiedBy?.fullName || "Pending"}
                      />
                    </div>
                    {payment.notes ? <p>{payment.notes}</p> : null}
                    {payment.proofUrl ? (
                      <a
                        className="text-link"
                        href={getAssetUrl(payment.proofUrl)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open uploaded proof
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No payment entries"
                description="Once payments are logged, they will be visible here."
              />
            )}
          </Panel>
        </section>
      ) : null}

      {activeTab === "community" ? (
        <section className="dashboard-grid two-column">
          <Panel
            eyebrow="Notices"
            title="Announcements"
            subtitle="General, urgent, maintenance, and event updates."
          >
            {data.announcements.length ? (
              <div className="list-stack">
                {data.announcements.map((announcement) => (
                  <article key={announcement._id} className="list-card">
                    <div className="list-card-header">
                      <div>
                        <h3>{announcement.title}</h3>
                        <p>
                          {announcement.createdBy?.fullName || "Management"} ·{" "}
                          {formatDate(announcement.createdAt)}
                        </p>
                      </div>
                      <StatusBadge value={announcement.type} />
                    </div>
                    <p>{announcement.body}</p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No announcements"
                description="Management updates will appear here."
              />
            )}
          </Panel>

          <Panel
            eyebrow="Mess"
            title="Food menu"
            subtitle="Weekly meal plan grouped by day."
          >
            {Object.keys(groupedMenu).length ? (
              <div className="menu-board">
                {Object.entries(groupedMenu).map(([day, items]) => (
                  <article key={day} className="menu-day-card">
                    <h3>{day}</h3>
                    <div className="list-stack">
                      {items.map((item) => (
                        <div key={item._id} className="menu-meal-card">
                          <div className="list-card-header">
                            <strong>{item.mealType}</strong>
                            <span>{item.items.length} items</span>
                          </div>
                          <p>{item.items.join(", ")}</p>
                          <small>{item.notes || "No notes."}</small>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Menu not available"
                description="No meal plan has been published yet."
              />
            )}
          </Panel>
        </section>
      ) : null}

      {activeTab === "laundry" ? (
        <section className="dashboard-grid two-column">
          <Panel
            eyebrow="Request"
            title="Create laundry job"
            subtitle="Log the count, service type, dates, and any notes."
          >
            <form className="stack-form" onSubmit={onCreateLaundryRequest}>
              <div className="form-grid">
                <Field label="Item count">
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={laundryForm.itemCount}
                    onChange={(event) =>
                      setLaundryForm((current) => ({
                        ...current,
                        itemCount: event.target.value
                      }))
                    }
                    required
                  />
                </Field>

                <Field label="Service type">
                  <select
                    className="input"
                    value={laundryForm.serviceType}
                    onChange={(event) =>
                      setLaundryForm((current) => ({
                        ...current,
                        serviceType: event.target.value
                      }))
                    }
                  >
                    <option value="wash">Wash</option>
                    <option value="wash & iron">Wash & iron</option>
                    <option value="dry clean">Dry clean</option>
                  </select>
                </Field>
              </div>

              <div className="form-grid">
                <Field label="Pickup date">
                  <input
                    className="input"
                    type="date"
                    value={laundryForm.pickupDate}
                    onChange={(event) =>
                      setLaundryForm((current) => ({
                        ...current,
                        pickupDate: event.target.value
                      }))
                    }
                  />
                </Field>

                <Field label="Delivery date">
                  <input
                    className="input"
                    type="date"
                    value={laundryForm.deliveryDate}
                    onChange={(event) =>
                      setLaundryForm((current) => ({
                        ...current,
                        deliveryDate: event.target.value
                      }))
                    }
                  />
                </Field>
              </div>

              <Field label="Estimated amount">
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={laundryForm.amount}
                  onChange={(event) =>
                    setLaundryForm((current) => ({
                      ...current,
                      amount: event.target.value
                    }))
                  }
                  placeholder="Optional"
                />
              </Field>

              <Field label="Notes">
                <textarea
                  className="input textarea"
                  value={laundryForm.notes}
                  onChange={(event) =>
                    setLaundryForm((current) => ({
                      ...current,
                      notes: event.target.value
                    }))
                  }
                  placeholder="Special handling instructions"
                />
              </Field>

              <button
                type="submit"
                className="primary-button"
                disabled={busyKey === "create-laundry"}
              >
                {busyKey === "create-laundry"
                  ? "Submitting..."
                  : "Request laundry"}
              </button>
            </form>
          </Panel>

          <Panel
            eyebrow="Track"
            title="Laundry status"
            subtitle="See every request and where it sits in the process."
          >
            {data.laundryRequests.length ? (
              <div className="list-stack">
                {data.laundryRequests.map((request) => (
                  <article key={request._id} className="list-card">
                    <div className="list-card-header">
                      <div>
                        <h3>{request.serviceType}</h3>
                        <p>{request.itemCount} items</p>
                      </div>
                      <StatusBadge value={request.status} />
                    </div>
                    <div className="detail-stack">
                      <DetailRow
                        label="Pickup"
                        value={formatDate(request.pickupDate)}
                      />
                      <DetailRow
                        label="Delivery"
                        value={formatDate(request.deliveryDate)}
                      />
                      <DetailRow
                        label="Amount"
                        value={
                          request.amount ? formatCurrency(request.amount) : "Not billed"
                        }
                      />
                    </div>
                    {request.notes ? <p>{request.notes}</p> : null}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No laundry requests"
                description="Create a request to start tracking status."
              />
            )}
          </Panel>
        </section>
      ) : null}
    </>
  );
}

function OwnerDashboard({
  activeTab,
  setActiveTab,
  data,
  studentDrafts,
  setStudentDrafts,
  roomDrafts,
  setRoomDrafts,
  complaintDrafts,
  setComplaintDrafts,
  paymentDrafts,
  setPaymentDrafts,
  announcementForm,
  setAnnouncementForm,
  roomForm,
  setRoomForm,
  menuForm,
  setMenuForm,
  onSaveStudent,
  onCreateRoom,
  onSaveRoom,
  onSaveComplaint,
  onSavePayment,
  onCreateAnnouncement,
  onCreateMenuItem,
  busyKey
}) {
  const complaintChartData = COMPLAINT_STATUS_OPTIONS.map((status) => ({
    name: status,
    value: data.complaints.filter((complaint) => complaint.status === status).length
  }));

  const roomChartData = ROOM_STATUS_OPTIONS.map((status) => ({
    name: status,
    value: data.rooms.filter((room) => room.status === status).length
  })).filter((entry) => entry.value > 0);

  const paymentChartData = PAYMENT_STATUS_OPTIONS.map((status) => ({
    name: status,
    value: data.payments.filter((payment) => payment.status === status).length
  }));

  const getAssignableRooms = (student, selectedRoomId) =>
    data.rooms.filter((room) => {
      const occupants = room.occupants || [];
      const isCurrentSelection = room._id === selectedRoomId;
      const isStudentAlreadyInRoom = occupants.some(
        (occupant) => occupant._id === student._id
      );

      return (
        isCurrentSelection ||
        isStudentAlreadyInRoom ||
        occupants.length < room.capacity
      );
    });

  return (
    <>
      <section className="hero-grid">
        <Panel
          eyebrow="Analytics"
          title={data.user.hostelName || "Hostel operations overview"}
          subtitle="Live counts across students, rooms, complaints, payments, and laundry activity."
          className="hero-panel"
        >
          <div className="metric-strip">
            <MetricCard
              label="Students"
              value={data.analytics.studentCount}
              helper="Active residents in the system"
            />
            <MetricCard
              label="Rooms"
              value={data.analytics.roomCount}
              helper={`${data.analytics.occupancyRate}% occupancy`}
            />
            <MetricCard
              label="Complaints"
              value={data.analytics.complaintCount}
              helper="Total complaints logged"
            />
            <MetricCard
              label="Pending payments"
              value={data.analytics.pendingPayments}
              helper="Awaiting owner action"
            />
          </div>
        </Panel>

        <Panel
          eyebrow="Queue"
          title="Operational pulse"
          subtitle="Immediate items that still need owner attention."
          className="compact-panel"
        >
          <div className="detail-stack">
            <DetailRow
              label="Laundry in system"
              value={data.analytics.activeLaundry}
            />
            <DetailRow
              label="Pending complaints"
              value={
                data.complaints.filter((complaint) => complaint.status === "pending")
                  .length
              }
            />
            <DetailRow
              label="Under-review payments"
              value={
                data.payments.filter((payment) => payment.status === "under review")
                  .length
              }
            />
            <DetailRow
              label="Recent announcements"
              value={data.analytics.latestAnnouncements.length}
            />
          </div>
        </Panel>
      </section>

      <TabBar tabs={OWNER_TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <section className="dashboard-grid analytics-layout">
          <Panel
            eyebrow="Complaints"
            title="Complaint status mix"
            subtitle="See backlog distribution across the complaint workflow."
          >
            <div className="chart-card">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complaintChartData}>
                  <XAxis dataKey="name" stroke="#475569" />
                  <YAxis stroke="#475569" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#ea580c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            eyebrow="Rooms"
            title="Room status"
            subtitle="Availability, occupancy, and maintenance distribution."
          >
            <div className="chart-card">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roomChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={4}
                  >
                    {roomChartData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            eyebrow="Payments"
            title="Payment verification queue"
            subtitle="Current distribution of payment states."
          >
            <div className="chart-card">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentChartData}>
                  <XAxis dataKey="name" stroke="#475569" />
                  <YAxis stroke="#475569" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            eyebrow="Broadcasts"
            title="Latest announcements"
            subtitle="Most recent updates already sent to residents."
          >
            {data.announcements.length ? (
              <div className="list-stack">
                {data.announcements.slice(0, 5).map((announcement) => (
                  <article key={announcement._id} className="list-card">
                    <div className="list-card-header">
                      <div>
                        <h3>{announcement.title}</h3>
                        <p>{formatDate(announcement.createdAt)}</p>
                      </div>
                      <StatusBadge value={announcement.type} />
                    </div>
                    <p>{announcement.body}</p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No announcements published"
                description="Use the announcements tab to send updates."
              />
            )}
          </Panel>
        </section>
      ) : null}

      {activeTab === "students" ? (
        <section className="dashboard-grid card-grid">
          {data.students.length ? (
            data.students.map((student) => {
              const draft = studentDrafts[student._id] || {
                fullName: student.fullName || "",
                phone: student.phone || "",
                emergencyContact: student.emergencyContact || "",
                room: student.room?._id || ""
              };
              const assignableRooms = getAssignableRooms(student, draft.room);

              return (
                <Panel
                  key={student._id}
                  eyebrow="Student"
                  title={student.fullName}
                  subtitle={`${student.email} · ${formatRoomLabel(student.room)}`}
                >
                  <div className="stack-form">
                    <Field label="Full name">
                      <input
                        className="input"
                        type="text"
                        value={draft.fullName}
                        onChange={(event) =>
                          setStudentDrafts((current) => ({
                            ...current,
                            [student._id]: {
                              ...draft,
                              fullName: event.target.value
                            }
                          }))
                        }
                      />
                    </Field>

                    <Field label="Phone">
                      <input
                        className="input"
                        type="tel"
                        value={draft.phone}
                        onChange={(event) =>
                          setStudentDrafts((current) => ({
                            ...current,
                            [student._id]: {
                              ...draft,
                              phone: event.target.value
                            }
                          }))
                        }
                      />
                    </Field>

                    <Field label="Emergency contact">
                      <input
                        className="input"
                        type="text"
                        value={draft.emergencyContact}
                        onChange={(event) =>
                          setStudentDrafts((current) => ({
                            ...current,
                            [student._id]: {
                              ...draft,
                              emergencyContact: event.target.value
                            }
                          }))
                        }
                      />
                    </Field>

                    <Field label="Assigned room">
                      <select
                        className="input"
                        value={draft.room}
                        onChange={(event) =>
                          setStudentDrafts((current) => ({
                            ...current,
                            [student._id]: {
                              ...draft,
                              room: event.target.value
                            }
                          }))
                        }
                      >
                        <option value="">Unassigned</option>
                        {assignableRooms.map((room) => (
                          <option key={room._id} value={room._id}>
                            {formatRoomLabel(room)} ({room.occupants.length}/{room.capacity})
                          </option>
                        ))}
                      </select>
                    </Field>

                    <button
                      type="button"
                      className="primary-button"
                      disabled={busyKey === `student-${student._id}`}
                      onClick={() => onSaveStudent(student._id)}
                    >
                      {busyKey === `student-${student._id}`
                        ? "Saving..."
                        : "Save student"}
                    </button>
                  </div>
                </Panel>
              );
            })
          ) : (
            <Panel
              eyebrow="Students"
              title="No students found"
              subtitle="Student accounts will show up here once they sign up."
            >
              <EmptyState
                title="No student data"
                description="Create or invite student accounts to begin room assignment."
              />
            </Panel>
          )}
        </section>
      ) : null}

      {activeTab === "rooms" ? (
        <section className="dashboard-grid two-column">
          <Panel
            eyebrow="Inventory"
            title="Create room"
            subtitle="Add a new room with structure, pricing, and amenities."
          >
            <form className="stack-form" onSubmit={onCreateRoom}>
              <div className="form-grid">
                <Field label="Room number">
                  <input
                    className="input"
                    type="text"
                    value={roomForm.roomNumber}
                    onChange={(event) =>
                      setRoomForm((current) => ({
                        ...current,
                        roomNumber: event.target.value
                      }))
                    }
                    required
                  />
                </Field>

                <Field label="Block">
                  <input
                    className="input"
                    type="text"
                    value={roomForm.block}
                    onChange={(event) =>
                      setRoomForm((current) => ({
                        ...current,
                        block: event.target.value
                      }))
                    }
                  />
                </Field>
              </div>

              <div className="form-grid">
                <Field label="Floor">
                  <input
                    className="input"
                    type="text"
                    value={roomForm.floor}
                    onChange={(event) =>
                      setRoomForm((current) => ({
                        ...current,
                        floor: event.target.value
                      }))
                    }
                  />
                </Field>

                <Field label="Capacity">
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={roomForm.capacity}
                    onChange={(event) =>
                      setRoomForm((current) => ({
                        ...current,
                        capacity: event.target.value
                      }))
                    }
                  />
                </Field>
              </div>

              <div className="form-grid">
                <Field label="Rent">
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={roomForm.rent}
                    onChange={(event) =>
                      setRoomForm((current) => ({
                        ...current,
                        rent: event.target.value
                      }))
                    }
                  />
                </Field>

                <Field label="Status">
                  <select
                    className="input"
                    value={roomForm.status}
                    onChange={(event) =>
                      setRoomForm((current) => ({
                        ...current,
                        status: event.target.value
                      }))
                    }
                  >
                    {ROOM_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Amenities">
                <input
                  className="input"
                  type="text"
                  value={roomForm.amenities}
                  onChange={(event) =>
                    setRoomForm((current) => ({
                      ...current,
                      amenities: event.target.value
                    }))
                  }
                  placeholder="Wi-Fi, balcony, attached bath"
                />
              </Field>

              <button
                type="submit"
                className="primary-button"
                disabled={busyKey === "create-room"}
              >
                {busyKey === "create-room" ? "Creating..." : "Add room"}
              </button>
            </form>
          </Panel>

          <Panel
            eyebrow="Manage"
            title="Room inventory"
            subtitle="Edit room status, structure, rent, and amenities."
          >
            {data.rooms.length ? (
              <div className="list-stack">
                {data.rooms.map((room) => {
                  const draft = roomDrafts[room._id] || {
                    roomNumber: room.roomNumber,
                    block: room.block || "",
                    floor: room.floor || "",
                    capacity: room.capacity,
                    rent: room.rent ?? "",
                    amenities: (room.amenities || []).join(", "),
                    status: room.status
                  };

                  return (
                    <article key={room._id} className="list-card">
                      <div className="list-card-header">
                        <div>
                          <h3>{formatRoomLabel(room)}</h3>
                          <p>
                            {room.occupants.length}/{room.capacity} occupied ·{" "}
                            {room.rent ? formatCurrency(room.rent) : "Rent not set"}
                          </p>
                        </div>
                        <StatusBadge value={room.status} />
                      </div>

                      <div className="form-grid compact-grid">
                        <Field label="Room">
                          <input
                            className="input"
                            type="text"
                            value={draft.roomNumber}
                            onChange={(event) =>
                              setRoomDrafts((current) => ({
                                ...current,
                                [room._id]: {
                                  ...draft,
                                  roomNumber: event.target.value
                                }
                              }))
                            }
                          />
                        </Field>

                        <Field label="Block">
                          <input
                            className="input"
                            type="text"
                            value={draft.block}
                            onChange={(event) =>
                              setRoomDrafts((current) => ({
                                ...current,
                                [room._id]: {
                                  ...draft,
                                  block: event.target.value
                                }
                              }))
                            }
                          />
                        </Field>

                        <Field label="Floor">
                          <input
                            className="input"
                            type="text"
                            value={draft.floor}
                            onChange={(event) =>
                              setRoomDrafts((current) => ({
                                ...current,
                                [room._id]: {
                                  ...draft,
                                  floor: event.target.value
                                }
                              }))
                            }
                          />
                        </Field>

                        <Field label="Capacity">
                          <input
                            className="input"
                            type="number"
                            min="1"
                            value={draft.capacity}
                            onChange={(event) =>
                              setRoomDrafts((current) => ({
                                ...current,
                                [room._id]: {
                                  ...draft,
                                  capacity: event.target.value
                                }
                              }))
                            }
                          />
                        </Field>

                        <Field label="Rent">
                          <input
                            className="input"
                            type="number"
                            min="0"
                            value={draft.rent}
                            onChange={(event) =>
                              setRoomDrafts((current) => ({
                                ...current,
                                [room._id]: {
                                  ...draft,
                                  rent: event.target.value
                                }
                              }))
                            }
                          />
                        </Field>

                        <Field label="Status">
                          <select
                            className="input"
                            value={draft.status}
                            onChange={(event) =>
                              setRoomDrafts((current) => ({
                                ...current,
                                [room._id]: {
                                  ...draft,
                                  status: event.target.value
                                }
                              }))
                            }
                          >
                            {ROOM_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>

                      <Field label="Amenities">
                        <input
                          className="input"
                          type="text"
                          value={draft.amenities}
                          onChange={(event) =>
                            setRoomDrafts((current) => ({
                              ...current,
                              [room._id]: {
                                ...draft,
                                amenities: event.target.value
                              }
                            }))
                          }
                        />
                      </Field>

                      <p className="supporting-text">
                        Occupants:{" "}
                        {room.occupants.length
                          ? room.occupants.map((occupant) => occupant.fullName).join(", ")
                          : "No students assigned"}
                      </p>

                      <button
                        type="button"
                        className="primary-button"
                        disabled={busyKey === `room-${room._id}`}
                        onClick={() => onSaveRoom(room._id)}
                      >
                        {busyKey === `room-${room._id}`
                          ? "Saving..."
                          : "Save room"}
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No rooms added"
                description="Use the room form to add your first inventory item."
              />
            )}
          </Panel>
        </section>
      ) : null}

      {activeTab === "complaints" ? (
        <section className="dashboard-grid card-grid">
          {data.complaints.length ? (
            data.complaints.map((complaint) => {
              const draft = complaintDrafts[complaint._id] || {
                status: complaint.status,
                resolutionNote: complaint.resolutionNote || ""
              };

              return (
                <Panel
                  key={complaint._id}
                  eyebrow="Complaint"
                  title={complaint.title}
                  subtitle={`${complaint.student?.fullName || "Student"} · Room ${formatRoomLabel(
                    complaint.room
                  )}`}
                >
                  <div className="detail-stack">
                    <DetailRow label="Category" value={complaint.category} />
                    <DetailRow label="Priority" value={complaint.priority} />
                    <DetailRow
                      label="Created"
                      value={formatDate(complaint.createdAt)}
                    />
                  </div>

                  <p>{complaint.description}</p>

                  <Field label="Status">
                    <select
                      className="input"
                      value={draft.status}
                      onChange={(event) =>
                        setComplaintDrafts((current) => ({
                          ...current,
                          [complaint._id]: {
                            ...draft,
                            status: event.target.value
                          }
                        }))
                      }
                    >
                      {COMPLAINT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Resolution note">
                    <textarea
                      className="input textarea"
                      value={draft.resolutionNote}
                      onChange={(event) =>
                        setComplaintDrafts((current) => ({
                          ...current,
                          [complaint._id]: {
                            ...draft,
                            resolutionNote: event.target.value
                          }
                        }))
                      }
                      placeholder="What was fixed and when?"
                    />
                  </Field>

                  <button
                    type="button"
                    className="primary-button"
                    disabled={busyKey === `complaint-${complaint._id}`}
                    onClick={() => onSaveComplaint(complaint._id)}
                  >
                    {busyKey === `complaint-${complaint._id}`
                      ? "Updating..."
                      : "Update complaint"}
                  </button>
                </Panel>
              );
            })
          ) : (
            <Panel
              eyebrow="Complaints"
              title="No complaints"
              subtitle="Complaint records appear here as students raise them."
            >
              <EmptyState
                title="Complaint queue is empty"
                description="There are no active complaint tickets right now."
              />
            </Panel>
          )}
        </section>
      ) : null}

      {activeTab === "payments" ? (
        <section className="dashboard-grid card-grid">
          {data.payments.length ? (
            data.payments.map((payment) => {
              const draft = paymentDrafts[payment._id] || {
                status: payment.status,
                notes: payment.notes || ""
              };

              return (
                <Panel
                  key={payment._id}
                  eyebrow="Payment"
                  title={payment.monthLabel || formatCurrency(payment.amount)}
                  subtitle={`${payment.student?.fullName || "Student"} · ${formatCurrency(
                    payment.amount
                  )}`}
                >
                  <div className="detail-stack">
                    <DetailRow label="Method" value={payment.method} />
                    <DetailRow label="Due date" value={formatDate(payment.dueDate)} />
                    <DetailRow label="Paid at" value={formatDate(payment.paidAt)} />
                    <DetailRow
                      label="Current status"
                      value={<StatusBadge value={payment.status} />}
                    />
                  </div>

                  <Field label="Verification status">
                    <select
                      className="input"
                      value={draft.status}
                      onChange={(event) =>
                        setPaymentDrafts((current) => ({
                          ...current,
                          [payment._id]: {
                            ...draft,
                            status: event.target.value
                          }
                        }))
                      }
                    >
                      {PAYMENT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Notes">
                    <textarea
                      className="input textarea"
                      value={draft.notes}
                      onChange={(event) =>
                        setPaymentDrafts((current) => ({
                          ...current,
                          [payment._id]: {
                            ...draft,
                            notes: event.target.value
                          }
                        }))
                      }
                      placeholder="Verification note or rejection reason"
                    />
                  </Field>

                  {payment.proofUrl ? (
                    <a
                      className="text-link"
                      href={getAssetUrl(payment.proofUrl)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View proof upload
                    </a>
                  ) : null}

                  <button
                    type="button"
                    className="primary-button"
                    disabled={busyKey === `payment-${payment._id}`}
                    onClick={() => onSavePayment(payment._id)}
                  >
                    {busyKey === `payment-${payment._id}`
                      ? "Saving..."
                      : "Save payment"}
                  </button>
                </Panel>
              );
            })
          ) : (
            <Panel
              eyebrow="Payments"
              title="No payments"
              subtitle="Payment records appear here when they are created."
            >
              <EmptyState
                title="No payment queue"
                description="There are no payment entries to verify yet."
              />
            </Panel>
          )}
        </section>
      ) : null}

      {activeTab === "announcements" ? (
        <section className="dashboard-grid two-column">
          <Panel
            eyebrow="Broadcast"
            title="Create announcement"
            subtitle="Publish updates to students or owners."
          >
            <form className="stack-form" onSubmit={onCreateAnnouncement}>
              <Field label="Title">
                <input
                  className="input"
                  type="text"
                  value={announcementForm.title}
                  onChange={(event) =>
                    setAnnouncementForm((current) => ({
                      ...current,
                      title: event.target.value
                    }))
                  }
                  required
                />
              </Field>

              <div className="form-grid">
                <Field label="Type">
                  <select
                    className="input"
                    value={announcementForm.type}
                    onChange={(event) =>
                      setAnnouncementForm((current) => ({
                        ...current,
                        type: event.target.value
                      }))
                    }
                  >
                    <option value="general">General</option>
                    <option value="urgent">Urgent</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="event">Event</option>
                  </select>
                </Field>

                <Field label="Audience">
                  <select
                    className="input"
                    value={announcementForm.audience}
                    onChange={(event) =>
                      setAnnouncementForm((current) => ({
                        ...current,
                        audience: event.target.value
                      }))
                    }
                  >
                    <option value="all">All</option>
                    <option value="students">Students</option>
                    <option value="owners">Owners</option>
                  </select>
                </Field>
              </div>

              <Field label="Message">
                <textarea
                  className="input textarea"
                  value={announcementForm.body}
                  onChange={(event) =>
                    setAnnouncementForm((current) => ({
                      ...current,
                      body: event.target.value
                    }))
                  }
                  required
                />
              </Field>

              <button
                type="submit"
                className="primary-button"
                disabled={busyKey === "create-announcement"}
              >
                {busyKey === "create-announcement"
                  ? "Publishing..."
                  : "Publish announcement"}
              </button>
            </form>
          </Panel>

          <Panel
            eyebrow="Mess"
            title="Publish food menu"
            subtitle="Create menu entries students can see in their dashboard."
          >
            <form className="stack-form" onSubmit={onCreateMenuItem}>
              <div className="form-grid">
                <Field label="Day">
                  <input
                    className="input"
                    type="text"
                    value={menuForm.day}
                    onChange={(event) =>
                      setMenuForm((current) => ({
                        ...current,
                        day: event.target.value
                      }))
                    }
                    placeholder="Monday"
                    required
                  />
                </Field>

                <Field label="Meal type">
                  <select
                    className="input"
                    value={menuForm.mealType}
                    onChange={(event) =>
                      setMenuForm((current) => ({
                        ...current,
                        mealType: event.target.value
                      }))
                    }
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="snacks">Snacks</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </Field>
              </div>

              <Field label="Items">
                <input
                  className="input"
                  type="text"
                  value={menuForm.items}
                  onChange={(event) =>
                    setMenuForm((current) => ({
                      ...current,
                      items: event.target.value
                    }))
                  }
                  placeholder="Poha, fruit, tea"
                  required
                />
              </Field>

              <Field label="Notes">
                <textarea
                  className="input textarea"
                  value={menuForm.notes}
                  onChange={(event) =>
                    setMenuForm((current) => ({
                      ...current,
                      notes: event.target.value
                    }))
                  }
                  placeholder="Optional dietary note"
                />
              </Field>

              <button
                type="submit"
                className="primary-button"
                disabled={busyKey === "create-menu"}
              >
                {busyKey === "create-menu" ? "Saving..." : "Publish menu"}
              </button>
            </form>
          </Panel>

          <Panel
            eyebrow="Feed"
            title="Announcement history"
            subtitle="Published notices ordered by recency."
          >
            {data.announcements.length ? (
              <div className="list-stack">
                {data.announcements.map((announcement) => (
                  <article key={announcement._id} className="list-card">
                    <div className="list-card-header">
                      <div>
                        <h3>{announcement.title}</h3>
                        <p>{formatDate(announcement.createdAt)}</p>
                      </div>
                      <StatusBadge value={announcement.type} />
                    </div>
                    <p>{announcement.body}</p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No announcements yet"
                description="Publish your first announcement from the form."
              />
            )}
          </Panel>

          <Panel
            eyebrow="Menu"
            title="Current meal plan"
            subtitle="Visible menu entries in the student dashboard."
          >
            {data.menu.length ? (
              <div className="list-stack">
                {data.menu.map((item) => (
                  <article key={item._id} className="list-card">
                    <div className="list-card-header">
                      <div>
                        <h3>
                          {item.day} · {item.mealType}
                        </h3>
                        <p>{item.items.join(", ")}</p>
                      </div>
                    </div>
                    <p>{item.notes || "No notes added."}</p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No menu entries"
                description="Use the menu form to publish meals."
              />
            )}
          </Panel>
        </section>
      ) : null}
    </>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Panel({ eyebrow, title, subtitle, children, className = "" }) {
  return (
    <section className={classNames("panel", className)}>
      <div className="panel-header">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ label, value, helper }) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{helper}</span>
    </article>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ value }) {
  return (
    <span className={classNames("status-badge", slugifyStatus(value))}>
      {value}
    </span>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function Banner({ tone, message }) {
  return (
    <div
      className={classNames(
        "banner",
        tone === "error" ? "banner-error" : "banner-success"
      )}
    >
      {message}
    </div>
  );
}

function TabBar({ tabs, activeTab, onChange }) {
  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={classNames(
            "tab-button",
            activeTab === tab.id && "tab-button-active"
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

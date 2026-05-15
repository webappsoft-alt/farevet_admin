import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { message } from "antd";
import { Spinner } from "react-bootstrap";
import { ArrowLeft } from "react-feather";
import { apiRequest } from "../../api/auth_api";
import "./medicationDatabase.scss";

const CONCIERGE_TABLE = "concierge_requests";

function prettyText(value) {
  const text = String(value ?? "").trim();
  if (!text) return "—";
  return text
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function moneyWithCurrency(amount, currency) {
  const num = Number(amount);
  const c = String(currency || "USD").toUpperCase();
  if (Number.isFinite(num)) return `${c} ${num.toFixed(2)}`;
  return `${c} ${String(amount || "0")}`;
}

function Field({ label, value, full }) {
  return (
    <div style={full ? { gridColumn: "1 / span 2" } : undefined}>
      <div className="med-field-lbl">{label}</div>
      <div className="med-finput">{value || "—"}</div>
    </div>
  );
}

const ConciergeRequestDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [request, setRequest] = useState(null);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const body = new FormData();
        body.append("type", "get_data");
        body.append("table_name", CONCIERGE_TABLE);
        body.append("id", String(id));
        const res = await apiRequest({ body });
        let row = null;
        if (Array.isArray(res?.data) && res.data.length > 0) row = res.data[0];
        else if (res?.data && typeof res.data === "object") row = res.data;
        else if (Array.isArray(res) && res.length > 0) row = res[0];
        else if (res && typeof res === "object") row = res;
        setRequest(row);
      } catch (error) {
        console.error(error);
        message.error("Could not load concierge request details.");
      } finally {
        setIsLoading(false);
      }
    };
    void fetchRequest();
  }, [id]);

  return (
    <div className="medication-panel">
      <div className="med-page-hdr">
        <div>
          <div className="med-page-title">FareVet Concierge Request Details</div>
          <div className="med-page-sub">Full request information from concierge_requests table.</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link
            to="/concierge-requests"
            className="med-btn med-btn-ghost"
            style={{ textDecoration: "none" }}
          >
            <ArrowLeft size={15} /> Back to requests
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="med-card">
          <div style={{ textAlign: "center", padding: 24 }}>
            <Spinner size="sm" color="inherit" />
          </div>
        </div>
      ) : !request ? (
        <div className="med-card">
          <div className="med-pb">
            <div style={{ fontSize: 13, color: "var(--med-red)" }}>
              Request not found.
            </div>
            <button
              type="button"
              className="med-btn med-btn-primary"
              style={{ marginTop: 12 }}
              onClick={() => navigate("/concierge-requests")}
            >
              Go back
            </button>
          </div>
        </div>
      ) : (
        <div className="med-card">
          <div className="med-ph">
            <div className="med-pt">
              Submission ID: {request?.submission_id || request?.id || "—"}
            </div>
          </div>
          <div className="med-pb">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Status" value={prettyText(request?.status)} />
              <Field label="Service Price" value={moneyWithCurrency(request?.service_price, request?.currency)} />
              <Field label="Pet Name" value={request?.pet_name} />
              <Field label="Species" value={prettyText(request?.species)} />
              <Field label="Breed" value={request?.breed} />
              <Field label="Sex" value={prettyText(request?.sex)} />
              <Field label="Date Of Birth" value={request?.date_of_birth} />
              <Field label="Size" value={request?.size} />
              <Field label="Procedure Category" value={prettyText(request?.procedure_category)} />
              <Field label="Urgency" value={prettyText(request?.urgency)} />
              <Field label="Travel Range" value={prettyText(request?.travel_range)} />
              <Field label="Budget Range" value={prettyText(request?.budget_range)} />
              <Field label="Result Delivery" value={prettyText(request?.result_delivery)} />
              <Field label="Insurance" value={request?.insurance} />
              <Field label="Description" value={request?.description} full />
              <Field label="Location" value={request?.location} full />
              <Field label="Customer Name" value={request?.customer_name} />
              <Field label="Customer Email" value={request?.customer_email} />
              <Field label="Customer Phone" value={request?.customer_phone} />
              <Field label="Submitted At" value={request?.created_at} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConciergeRequestDetail;

import React, { useState, useEffect } from "react";
import { Modal, Form } from "react-bootstrap";
import { message } from "antd";
import moment from "moment";
import { apiRequest } from "../../../api/auth_api";
import Spinner from "../../Spinner";
import { calendersmall, clock } from "../../icons/icon";

const safeParseSchedule = (value) => {
  if (!value) return [];
  try {
    let parsed = value;
    if (typeof parsed === "string") {
      parsed = parsed.replace(/\\"/g, '"');
      parsed = JSON.parse(parsed);
    }
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const EditAppointmentModal = ({ show, handleClose, selectedItem, onSuccess }) => {
  const [draftDate, setDraftDate] = useState("");
  const [draftTime, setDraftTime] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (show && selectedItem) {
      const bDate = selectedItem?.booking_date === "0000-00-00" ? "" : selectedItem?.booking_date;
      setDraftDate(bDate || "");
      const raw12 = selectedItem?.booking_time_12hour || "";
      if (raw12) {
        const converted = moment(raw12, ["h:mm A", "hh:mm A"]).format("HH:mm");
        setDraftTime(converted !== "Invalid date" ? converted : "");
      } else {
        setDraftTime("");
      }
      setDraftNote(selectedItem?.admin_note || "");
    }
  }, [show, selectedItem]);

  const handleSave = async () => {
    if (selectedItem?.status === "pending") {
      if (!draftDate) {
        message.error("Please enter a valid date.");
        return;
      }
      if (!draftTime) {
        message.error("Please enter a valid time.");
        return;
      }
    }

    setIsSaving(true);
    const formatted12 = moment(draftTime, "HH:mm").format("h:mm A");
    const formatted24 = moment(draftTime, "HH:mm").format("HH:mm:ss");

    const parsedSchedule = safeParseSchedule(selectedItem?.schedule);
    const isFromSchedule = parsedSchedule.some(
      (slot) => slot.date === draftDate && moment(slot.time, ["h:mm A", "hh:mm A"]).format("h:mm A") === formatted12
    );

    let isRescheduled = false;
    if (selectedItem?.status === "pending") {
      if (!isFromSchedule) {
        isRescheduled = true;
      }
    }

    const body = new FormData();
    body.append("type", "update_data");
    body.append("table_name", "orders");
    body.append("id", selectedItem?.id);
    body.append("booking_date", draftDate);
    body.append("booking_time_12hour", formatted12);
    body.append("booking_time", formatted24);
    body.append("admin_note", draftNote);

    if (isRescheduled) {
      body.append("rescheduled", 1);
    }

    const res = await apiRequest({ body });
    setIsSaving(false);

    if (res?.result === true) {
      message.success("Appointment updated successfully.");
      onSuccess({
        ...selectedItem,
        booking_date: draftDate,
        booking_time_12hour: formatted12,
        admin_note: draftNote,
      });
      handleClose();
    } else {
      message.error("Failed to update appointment.");
    }
  };

  const parsedSchedule = safeParseSchedule(selectedItem?.schedule);

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="text-xl font-bold">Edit Appointment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {selectedItem?.status === "cancelled" && (
            <div className="mb-4 p-3 bg-[#FFF0F0] border border-[#FF4D4F]/30 text-[#FF4D4F] rounded-xl font-bold text-[13px] text-center">
              This appointment has been rejected / cancelled.
            </div>
          )}

          {(selectedItem?.status === "processing" || selectedItem?.status === "completed") && (
            <div className="mb-4">
              <label className="font-semibold block mb-2 text-sm text-[#1A1A2E]">
                Confirmed Schedule
              </label>
              <div className="flex items-center gap-6 p-3 bg-[#F9F9FB] border border-[#E8E8F0] rounded-xl">
                <div className="flex items-center gap-2">
                  <img src={calendersmall} alt="" className="w-4 h-4 opacity-70" />
                  <span className="font-bold text-[14px] text-[#1A1A2E]">{selectedItem?.booking_date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <img src={clock} alt="" className="w-4 h-4 opacity-70" />
                  <span className="font-bold text-[14px] text-[#1A1A2E]">{selectedItem?.booking_time_12hour}</span>
                </div>
              </div>
            </div>
          )}

          {selectedItem?.status === "pending" && (
            <>
              {parsedSchedule && parsedSchedule.length > 0 && (
                <div className="mb-4">
                  <label className="font-semibold block mb-2 text-sm text-[#1A1A2E]">
                    Client's Requested Schedules
                  </label>
                  <div className="flex flex-col gap-2 w-full">
                    {parsedSchedule.map((slot, idx) => {
                      const isSelected =
                        draftDate === slot.date &&
                        draftTime === moment(slot.time, ["h:mm A", "hh:mm A"]).format("HH:mm");

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setDraftDate(slot.date);
                            const converted = moment(slot.time, ["h:mm A", "hh:mm A"]).format("HH:mm");
                            setDraftTime(converted !== "Invalid date" ? converted : "");
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected
                            ? "border-[#8930F9] bg-[#F3EEFF]"
                            : "border-[#E8E8F0] hover:border-[#8930F9]/50"
                            }`}
                        >
                          <div
                            className={`flex items-center justify-center w-5 h-5 rounded-full border ${isSelected ? "border-[#8930F9] bg-[#8930F9]" : "border-[#d3d3d3]"
                              }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <img src={calendersmall} alt="" />
                              <span className="font-medium text-sm text-[#1A1A2E]">{slot.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <img src={clock} style={{ width: "24px", height: "auto" }} alt="" />
                              <span className="font-medium text-sm text-[#1A1A2E]">{slot.time}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-3">
                <Form.Group>
                  <Form.Label className="font-semibold text-sm text-[#1A1A2E]">Manual Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={draftDate}
                    onChange={(e) => setDraftDate(e.target.value)}
                    className="rounded-xl border-[#E8E8F0] text-sm text-[#1A1A2E]"
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label className="font-semibold text-sm text-[#1A1A2E]">Manual Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={draftTime}
                    onChange={(e) => setDraftTime(e.target.value)}
                    className="rounded-xl border-[#E8E8F0] text-sm text-[#1A1A2E]"
                  />
                </Form.Group>
              </div>
            </>
          )}
          <Form.Group className="mb-3">
            <Form.Label className="font-semibold">Admin Note</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Note (visible to client)"
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <button
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          onClick={handleClose}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-[#8930F9] text-white rounded-md hover:bg-[#7820E8] transition-colors flex items-center justify-center min-w-[120px]"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <Spinner size={20} color="inherit" /> : "Save Changes"}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditAppointmentModal;

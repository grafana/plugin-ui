"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmModal = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importStar(require("react"));
const ui_1 = require("@grafana/ui");
function ConfirmModal({ isOpen, onCancel, onDiscard, onCopy }) {
    const buttonRef = (0, react_1.useRef)(null);
    // Moved from grafana/ui
    (0, react_1.useEffect)(() => {
        var _a;
        // for some reason autoFocus property did no work on this button, but this does
        if (isOpen) {
            (_a = buttonRef.current) === null || _a === void 0 ? void 0 : _a.focus();
        }
    }, [isOpen]);
    return (react_1.default.createElement(ui_1.Modal, { title: react_1.default.createElement("div", { className: "modal-header-title" },
            react_1.default.createElement(ui_1.Icon, { name: "exclamation-triangle", size: "lg" }),
            react_1.default.createElement("span", { className: "p-l-1" }, "Warning")), onDismiss: onCancel, isOpen: isOpen },
        react_1.default.createElement("p", null, "Builder mode does not display changes made in code. The query builder will display the last changes you made in builder mode."),
        react_1.default.createElement("p", null, "Do you want to copy your code to the clipboard?"),
        react_1.default.createElement(ui_1.Modal.ButtonRow, null,
            react_1.default.createElement(ui_1.Button, { type: "button", variant: "secondary", onClick: onCancel, fill: "outline" }, "Cancel"),
            react_1.default.createElement(ui_1.Button, { variant: "destructive", type: "button", onClick: onDiscard, ref: buttonRef }, "Discard code and switch"),
            react_1.default.createElement(ui_1.Button, { variant: "primary", onClick: onCopy }, "Copy code and switch"))));
}
exports.ConfirmModal = ConfirmModal;
//# sourceMappingURL=ConfirmModal.js.map
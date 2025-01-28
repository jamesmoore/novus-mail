interface DialogAlertProps {
    visible: boolean;
    text: string;
    onOk?: () => void;
}

function DialogAlert({ visible, text, onOk }: DialogAlertProps) {

    return (
        visible &&
        <div style={{ width: "100%", height: "100%", position: "absolute", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div id="dialogBox" style={{ width: "min(300px, calc(100% - 40px))", boxSizing: "border-box", padding: "10px", minHeight: "50px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <span id="dialogBoxText">{text}</span>
                <div>
                    <button id="dialogBoxOkButton" onClick={onOk} style={{ width: "100px" }} tabIndex={0}>OK</button>
                </div>
            </div>
        </div>
    )
}

export default DialogAlert;
import { isEnterKeyUp, isLeftMouseClick } from "./Events";

interface DialogConfProps {
    visible: boolean;
    text: string;
    onYes?: () => void;
    onNo?: () => void;
}

function DialogConf({ visible, text, onYes, onNo }: DialogConfProps) {

    const handleYesClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isLeftMouseClick(e) && onYes) {
            await onYes();
        }
    };

    const handleYesKey = async (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (isEnterKeyUp(e) && onYes) {
            await onYes();
        }
    };

    const handleNoClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isLeftMouseClick(e) && onNo) {
            await onNo();
        }
    };

    const handleNoKey = async (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (isEnterKeyUp(e) && onNo) {
            await onNo();
        }
    };

    return (
        visible && <div style={{ width: "100%", height: "100%", position: "absolute", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div id="dialogBox" style={{ width: "min(300px, calc(100% - 40px))", boxSizing: "border-box", padding: "10px", minHeight: "50px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <span id="dialogBoxText">{text}</span>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
                    <button id="dialogBoxYesButton" onClick={handleYesClick} onKeyUp={handleYesKey}  style={{ width: "100px" }} tabIndex={0}>Yes</button>
                    <button onClick={handleNoClick} onKeyUp={handleNoKey} style={{ width: "100px" }} tabIndex={0}>No</button>
                </div>
            </div>
        </div>
    )
}

export default DialogConf;

import React, { useEffect } from 'react';

declare global {
  interface Window {
    $crisp: any;
    CRISP_WEBSITE_ID: string;
  }
}

const CrispChat: React.FC = () => {
  useEffect(() => {
    // Include Crisp Script
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = "9c2820bc-6f6e-42a8-b05e-f1187570c48a"; // SkillZone ID from original site source

    // Hide default Crisp launcher bubble to not interfere with our custom UI
    window.$crisp.push(["config", "hide:on:desktop", [true]]);
    window.$crisp.push(["config", "hide:on:mobile", [true]]);

    (function () {
      var d = document;
      var s = d.createElement("script");
      s.src = "https://client.crisp.chat/l.js";
      s.async = true;
      d.getElementsByTagName("head")[0].appendChild(s);
    })();
  }, []);

  return null; // Crisp renders itself
};

export default CrispChat;

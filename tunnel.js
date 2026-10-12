// Starts a free public tunnel (Cloudflare "quick tunnel") so a phone on ANY network can open the site.
// Needs the free "cloudflared" program installed on the PC. If it is missing, nothing breaks:
// the QR code simply falls back to the Wi-Fi address.
const { spawn } = require("child_process");

function startTunnel(port, onUrl, log) {
  log = log || console.log;
  let child;
  try {
    child = spawn("cloudflared", ["tunnel", "--url", "http://localhost:" + port, "--no-autoupdate"], {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
  } catch (e) {
    log("Could not start tunnel: " + e.message);
    return null;
  }

  let acc = "";
  let found = false;
  const scan = (chunk) => {
    if (found) return;
    acc = (acc + chunk.toString()).slice(-4000);
    const m = acc.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (m) {
      found = true;
      onUrl(m[0]);
    }
  };
  child.stdout.on("data", scan);
  child.stderr.on("data", scan);

  child.on("error", (e) => {
    if (e.code === "ENOENT") {
      log("Tip: install cloudflared (winget install Cloudflare.cloudflared) so the QR code works on any network. Using Wi-Fi address for now.");
    } else {
      log("Tunnel error: " + e.message);
    }
  });
  child.on("exit", () => {
    found = false;
    onUrl(null);
  });
  process.on("exit", () => {
    try { child.kill(); } catch (e) {}
  });
  return child;
}

module.exports = { startTunnel };

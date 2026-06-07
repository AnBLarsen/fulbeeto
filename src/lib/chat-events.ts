export const OPEN_CHAT_EVENT = "fulbee:open-chat";

export function openChat() {
  window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT));
}

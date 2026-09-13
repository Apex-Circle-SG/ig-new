import { INCOME_EMBED_CHANNEL } from './protocol';

/** Clipboard access is held by the parent; the message contains no calculator data. */
export function requestPublicToolShare(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.parent === window) {
      reject(new Error('Open the calculator page to share the tool.'));
      return;
    }
    const timer = window.setTimeout(() => {
      window.removeEventListener('message', acknowledge);
      reject(new Error('Clipboard permission was unavailable.'));
    }, 2500);
    function acknowledge(event: MessageEvent) {
      if (
        event.source !== window.parent ||
        event.data?.channel !== INCOME_EMBED_CHANNEL ||
        event.data?.type !== 'share-result'
      )
        return;
      window.clearTimeout(timer);
      window.removeEventListener('message', acknowledge);
      if (event.data.ok === true) resolve();
      else reject(new Error('Clipboard permission was unavailable.'));
    }
    window.addEventListener('message', acknowledge);
    window.parent.postMessage({ channel: INCOME_EMBED_CHANNEL, type: 'share-tool' }, '*');
  });
}

// public/service-worker.ts
self.addEventListener("install", (event) => {
  console.log("\uD83D\uDD27 Service Worker instalado");
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  console.log("\uD83D\uDE80 Service Worker ativado");
  event.waitUntil(self.clients.claim());
});
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-upload-session") {
    console.log("\uD83D\uDCE4 Sincronizando sessão de upload em background");
    event.waitUntil(syncUploadSession());
  }
});
async function syncUploadSession() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(["uploadSessions"], "readonly");
    const store = transaction.objectStore("uploadSessions");
    const request = store.get("devel_upload_session");
    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const session = request.result;
        if (session && session.jobId) {
          try {
            const response = await fetch(`/api/jobs/${session.jobId}`);
            if (!response.ok)
              throw new Error(`HTTP ${response.status}`);
            const job = await response.json();
            const clients = await self.clients.matchAll();
            clients.forEach((client) => {
              client.postMessage({
                type: "SYNC_UPDATE",
                jobId: session.jobId,
                status: job.status,
                progress: job.progress
              });
            });
            resolve(job);
          } catch (error) {
            console.error("❌ Erro ao sincronizar:", error);
            reject(error);
          }
        } else {
          resolve(null);
        }
      };
      request.onerror = () => {
        reject(new Error("Erro ao acessar IndexedDB"));
      };
    });
  } catch (error) {
    console.error("❌ Erro em syncUploadSession:", error);
    throw error;
  }
}
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("DevelApp", 1);
    request.onerror = () => {
      reject(request.error);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("uploadSessions")) {
        db.createObjectStore("uploadSessions");
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}
self.addEventListener("message", (event) => {
  if (event.data.type === "REQUEST_BACKGROUND_SYNC") {
    console.log("\uD83D\uDCEC Solicitação de background sync recebida");
    self.registration.sync.register("sync-upload-session");
  }
});
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-upload-status") {
    console.log("⏰ Verificação periódica de upload");
    event.waitUntil(syncUploadSession());
  }
});

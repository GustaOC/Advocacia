// Fix para Monaco Editor - Workers
// Coloque este arquivo em public/monaco-fix.js ou ajuste conforme sua estrutura

self.MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label) {
    return URL.createObjectURL(
      new Blob([`
        self.MonacoEnvironment = { baseUrl: '/' };
        importScripts('/_next/static/monaco-editor/min/vs/base/worker/workerMain.js');
      `], { type: 'application/javascript' })
    );
  }
};

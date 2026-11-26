// Ponte segura entre a tela e o programa: expõe só as ações de backup do desktop.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  salvarBackupComo: (token) => ipcRenderer.invoke('backup:salvar-como', token),
  restaurarDeArquivo: (token) => ipcRenderer.invoke('backup:restaurar-arquivo', token),
  restaurarDaLista: (token, arquivo) => ipcRenderer.invoke('backup:restaurar-lista', token, arquivo),
  abrirPastaBackups: (token) => ipcRenderer.invoke('backup:abrir-pasta', token),
});

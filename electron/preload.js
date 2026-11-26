// Ponte segura entre a tela e o programa: expõe só as ações do desktop (modo e backup).
const { contextBridge, ipcRenderer } = require('electron');

const info = ipcRenderer.sendSync('config:info-sync');

contextBridge.exposeInMainWorld('desktop', {
  modo: info.modo, // 'principal' | 'cliente' | null
  versao: info.versao,
  info: () => ipcRenderer.invoke('config:info'),
  testarConexao: (endereco) => ipcRenderer.invoke('config:testar', endereco),
  escolherModo: (modo, endereco) => ipcRenderer.invoke('config:escolher-modo', modo, endereco),
  tentarNovamente: () => ipcRenderer.invoke('config:tentar-novamente'),
  reconfigurar: () => ipcRenderer.invoke('config:reconfigurar'),
  salvarBackupComo: (token) => ipcRenderer.invoke('backup:salvar-como', token),
  restaurarDeArquivo: (token) => ipcRenderer.invoke('backup:restaurar-arquivo', token),
  restaurarDaLista: (token, arquivo) => ipcRenderer.invoke('backup:restaurar-lista', token, arquivo),
  abrirPastaBackups: (token, qual) => ipcRenderer.invoke('backup:abrir-pasta', token, qual),
  definirPastaExtra: (token, sugestao) => ipcRenderer.invoke('backup:definir-extra', token, sugestao),
  removerPastaExtra: (token) => ipcRenderer.invoke('backup:remover-extra', token),
});

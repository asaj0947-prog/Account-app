const { contextBridge, ipcRenderer } = require('electron')

// 只暴露白名单接口给渲染进程（界面），保证安全
contextBridge.exposeInMainWorld('api', {
  getCategories: () => ipcRenderer.invoke('categories:get'),
  addCategory: (arg) => ipcRenderer.invoke('categories:add', arg),
  addSubcategory: (arg) => ipcRenderer.invoke('categories:addSub', arg),
  removeCategory: (l1Name) => ipcRenderer.invoke('categories:remove', l1Name),
  removeSubcategory: (arg) => ipcRenderer.invoke('categories:removeSub', arg),
  getRecords: () => ipcRenderer.invoke('records:get'),
  addRecord: (payload) => ipcRenderer.invoke('records:add', payload),
  updateRecord: (id, payload) => ipcRenderer.invoke('records:update', { id, payload }),
  removeRecord: (id) => ipcRenderer.invoke('records:remove', id),
  exportCsv: () => ipcRenderer.invoke('data:exportCsv'),
  importCsv: () => ipcRenderer.invoke('data:importCsv'),
  clearData: (scope) => ipcRenderer.invoke('data:clearData', scope),
  downloadTemplate: () => ipcRenderer.invoke('data:downloadTemplate'),
  getHighScore: () => ipcRenderer.invoke('snake:getHighScore'),
  setHighScore: (score) => ipcRenderer.invoke('snake:setHighScore', score)
})

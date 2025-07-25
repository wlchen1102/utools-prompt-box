// uTools preload script
// 这个文件运行在主进程和渲染进程之间，提供安全的 API 桥接

console.log('uTools preload script loaded');

// 在这里可以暴露安全的 API 给渲染进程
// 例如：
// const { contextBridge, ipcRenderer } = require('electron');
// 
// contextBridge.exposeInMainWorld('electronAPI', {
//   // 暴露给渲染进程的 API
// }); 
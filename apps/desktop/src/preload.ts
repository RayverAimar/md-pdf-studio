import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("mdPdfStudio", {});

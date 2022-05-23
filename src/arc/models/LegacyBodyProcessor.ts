/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable class-methods-use-this */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/events').ArcResponse.Response} ArcResponse */
/** @typedef {import('@advanced-rest-client/events').RequestBody.MultipartBody} MultipartBody */
/** @typedef {import('@advanced-rest-client/events').ArcResponse.TransformedPayload} TransformedPayload */
/** @typedef {import('@advanced-rest-client/events').WebSocket.WebsocketRequest} WebsocketRequest */
/** @typedef {import('@advanced-rest-client/events').WebSocket.WebsocketLog} WebsocketLog */

import { ARCHistoryRequest, ARCSavedRequest, MultipartBody, Response as ArcResponse, TransformedPayload } from "@api-client/core/build/legacy.js";

/**
 * This was copied from the legacy ARC "lib" repo to restore the payload state using the legacy system.
 * 
 * @deprecated This is only to upgrade the legacy data to the new data structure. Do not use it to store any data.
 * 
 * Please, do not make changes to this class. It was extensively tested in the previous system but the tests for this is not 
 * included in with this library.
 */
export class LegacyBodyProcessor {
  /**
   * Transforms the request payload to string if needed and the response payload when set.
   * Note, this returns copy of the object if any transformation is applied.
   *
   * @param request ArcRequest object
   * @returns A copy of the request object with transformed payload
   */
  static async stringifyRequest(request: ARCHistoryRequest|ARCSavedRequest): Promise<ARCHistoryRequest|ARCSavedRequest> {
    const cp = await LegacyBodyProcessor.payloadToString(request) as ARCHistoryRequest;
    if (cp.response && cp.response.payload) {
      cp.response = await LegacyBodyProcessor.payloadToString(cp.response as ArcResponse) as ArcResponse;
    }
    return cp;
  }

  /**
   * Restores the payload into its original format from both the request and response objects.
   * 
   * @param request ArcRequest object
   * @returns Processed request
   */
  static restoreRequest(request: ARCHistoryRequest|ARCSavedRequest): ARCHistoryRequest|ARCSavedRequest {
    const processed = LegacyBodyProcessor.restorePayload(request) as ARCHistoryRequest;
    if (processed.response) {
      processed.response = LegacyBodyProcessor.restorePayload((processed.response as ArcResponse)) as ArcResponse;
    }
    return processed;
  }

  /**
   * Transforms request payload to string if needed.
   * Note, this returns copy of the object if any transformation is applied.
   *
   * @param request ArcRequest object
   * @returns A copy of the request object with transformed payload
   */
  static async payloadToString(request: ARCHistoryRequest|ARCSavedRequest|ArcResponse): Promise<ARCHistoryRequest|ARCSavedRequest|ArcResponse> {
    if (!request.payload || typeof request.payload === 'string') {
      return request;
    }
    const data = { ...request } as ARCHistoryRequest|ARCSavedRequest|ArcResponse;
    if (data.payload instanceof FormData) {
      const body = (data.payload) as FormData;
      // @ts-ignore
      if (!body.entries) {
        data.payload = undefined;
        return data;
      }
      const entry = await LegacyBodyProcessor.createMultipartEntry(body);
      data.payload = undefined;
      // @ts-ignore
      data.multipart = entry;
      return data;
    } 
    if (data.payload instanceof Blob) {
      const body = (data.payload) as Blob;
      const result = await LegacyBodyProcessor.blobToString(body);
      data.payload = undefined;
      // @ts-ignore
      data.blob = result;
      return data;
    }
    const transformed = LegacyBodyProcessor.bufferToTransformed(data.payload) || LegacyBodyProcessor.arrayBufferToTransformed(data.payload);
    if (transformed) {
      data.payload = transformed;
      return data;
    }
    return data;
  }

  /**
   * When the passed argument is a NodeJS buffer it creates an object describing the buffer
   * in a safe to store object.
   * 
   * @returns The buffer metadata or undefined if the passed argument is not a Buffer.
   */
  static bufferToTransformed(payload: unknown): TransformedPayload | undefined {
    const typedBuffer = payload as Buffer;
    if (typeof typedBuffer.copy === 'function') {
      return {
        type: 'Buffer',
        data: [...typedBuffer],
      };
    }
    return undefined;
  }

  /**
   * When the passed argument is an ArrayBuffer it creates an object describing the object in a safe to store object.
   * 
   * @returns The buffer metadata or undefined if the passed argument is not an ArrayBuffer.
   */
  static arrayBufferToTransformed(payload: unknown): TransformedPayload | undefined {
    const typedArrayBuffer = (payload) as ArrayBuffer;
    if (typedArrayBuffer.byteLength) {
      const view = new Uint8Array(typedArrayBuffer);
      return {
        type: 'ArrayBuffer',
        data: Array.from(view),
      };
    }
    return undefined;
  }

  /**
   * Computes `multipart` list value to replace FormData with array that can
   * be stored in the datastore.
   *
   * @param payload FormData object
   * @returns A promise resolved to a datastore safe entries.
   */
  static createMultipartEntry(payload: FormData): Promise<MultipartBody[]> {
    const promises = [];
    // @ts-ignore
    for(const pair of payload.entries()) {
      const [name, file] = pair;
      promises.push(LegacyBodyProcessor.computeFormDataEntry(name, file));
    }
    return Promise.all(promises);
  }

  /**
   * Transforms a FormData entry into a safe-to-store text entry
   *
   * @param name The part name
   * @param file The part value
   * @returns Transformed FormData part to a datastore safe entry.
   */
  static async computeFormDataEntry(name: string, file: string | File): Promise<MultipartBody> {
    if (typeof file === 'string') {
      // when adding an item to the FormData object without 3rd parameter of the append function
      // then  the value is a string.
      return {
        isFile: false,
        name,
        value: file,
        enabled: true,
      };
    }
    const value = await LegacyBodyProcessor.blobToString(file);
    const part: MultipartBody = ({
      isFile: false,
      name,
      value,
      enabled: true,
    });
    if (file.name === 'blob') {
      // ARC adds the "blob" filename when the content type is set on the editor.
      // otherwise it wouldn't be possible to set the content type value.
      part.type = file.type;
    } else {
      part.isFile = true;
      part.fileName = file.name;
    }
    return part;
  }

  /**
   * Converts blob data to base64 string.
   *
   * @param blob File or blob object to be translated to string
   * @returns Promise resolved to a base64 string data from the file.
   */
  static blobToString(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = (e: ProgressEvent<FileReader>): void => {
        resolve(String((e.target as FileReader).result));
      };
      reader.onerror = (): void => {
        reject(new Error('Unable to convert blob to string.'));
      };
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Restores the payload into its original format.
   * 
   * @param request ArcRequest object
   * @returns Processed request
   */
  static restorePayload(request: ARCHistoryRequest|ARCSavedRequest|ArcResponse): ARCHistoryRequest|ARCSavedRequest|ArcResponse {
    const typedSaved = ({ ...request }) as ARCSavedRequest;
    if (typedSaved.multipart) {
      try {
        typedSaved.payload = LegacyBodyProcessor.restoreMultipart(typedSaved.multipart);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Unable to restore payload.', e);
      }
      delete typedSaved.multipart;
      return typedSaved;
    } 
    if (typedSaved.blob) {
      try {
        typedSaved.payload = LegacyBodyProcessor.dataURLtoBlob(typedSaved.blob);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Unable to restore payload.', e);
      }
      delete typedSaved.blob;
      return typedSaved;
    }
    if (!typedSaved.payload || typeof typedSaved.payload === 'string') {
      return typedSaved;
    }
    const restored = LegacyBodyProcessor.transformedToPayload(typedSaved.payload);
    if (restored) {
      typedSaved.payload = restored;
      return typedSaved;
    }
    return typedSaved;
  }

  /**
   * Handles potential `TransformedPayload` and returns the original data
   * 
   * @returns The original data format or undefined otherwise.
   */
  static transformedToPayload(payload: unknown): Buffer|ArrayBuffer|undefined {
    const body =  (payload) as TransformedPayload;
    if (body.type === 'ArrayBuffer') {
      const { buffer } = new Uint8Array(body.data);
      return buffer;
    }
    if (body.type === 'Buffer') {
      return Buffer.from(body.data);
    }
    return undefined;
  }

  /**
   * Restores FormData from ARC data model.
   *
   * @param model ARC model for multipart.
   * @returns Restored form data
   */
  static restoreMultipart(model: MultipartBody[]): FormData {
    const fd = new FormData();
    if (!Array.isArray(model) || !model.length) {
      return fd;
    }
    model.forEach((part) => {
      const { isFile, name, value, type, fileName, enabled } = part;
      if (enabled === false) {
        return;
      }
      let blob;
      if (isFile) {
        blob = LegacyBodyProcessor.dataURLtoBlob(value);
        fd.append(name, blob, fileName);
      } else if (type) {
        blob = LegacyBodyProcessor.dataURLtoBlob(value);
        fd.append(name, blob, 'blob');
      } else {
        fd.append(name, value);
      }
    });
    return fd;
  }

  /**
   * Converts data-url string to blob
   *
   * @param dataUrl Data url from blob value.
   * @returns Restored blob value
   */
  static dataURLtoBlob(dataUrl: string):Blob {
    const arr = dataUrl.split(',');
    // @ts-ignore
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    // eslint-disable-next-line no-plusplus
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  /**
   * Converts blob data to a string.
   *
   * @param blob File or blob object to be translated to string
   * @returns Promise resolved to a text value of the file
   */
  static fileToString(blob: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = (e: ProgressEvent<FileReader>): void => {
        resolve(String((e.target as FileReader).result));
      };
      reader.onerror = (): void => {
        reject(new Error('Unable to convert blob to string.'));
      };
      reader.readAsText(blob);
    });
  }
}

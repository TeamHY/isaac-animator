import { onMounted } from "vue";
import { Anm2Parser } from "../parser/Anm2Parser";
import { Anm2Renderer } from "../renderer/Anm2Renderer";
import {
  onMenuNewFile,
  onMenuOpenFile,
  onMenuOpenFileError,
  onMenuSaveFile,
  onMenuSaveAsFile,
} from "@app/preload";
import { getSpritesheetData, type SpritesheetDataMap } from "../utils/spritesheetData";

/**
 * File handling composable
 */
export function useFileHandler(
  setRenderer: (renderer: Anm2Renderer | null, anm2Path: string) => void,
  resetState: () => void,
  setAnimation: (name: string) => void
) {
  const handleFileOpen = async (data: { filePath: string; content: string }) => {
    try {
      const anm2Data = Anm2Parser.parseFromString(data.content);
      
      const spritesheets: SpritesheetDataMap = new Map();

      const loadPromises =  anm2Data.content.spritesheets.map(
        async (spritesheet) => {
          const spritesheetData = await getSpritesheetData(data.filePath, spritesheet);

          if (!spritesheetData) {
            return;
          }

          spritesheets.set(spritesheet.id, spritesheetData);
        }
      )
      await Promise.all(loadPromises)

      const newRenderer = new Anm2Renderer(anm2Data, spritesheets);

      setRenderer(newRenderer, data.filePath);

      if (anm2Data.defaultAnimation) {
        setAnimation(anm2Data.defaultAnimation);
      }
    } catch (error) {
      console.error("Failed to load file:", error);
      alert("Failed to load file: " + error);
    }
  };

  const handleFileOpenError = (error: any) => {
    console.error("File open error:", error);
    alert("Failed to open file: " + error);
  };

  const handleNewFile = () => {
    resetState();
  };

  const handleSaveFile = () => {
    // TODO: Implement file save logic
    console.log("Save file functionality not implemented yet");
  };

  const handleSaveAsFile = (filePath: string) => {
    // TODO: Implement save as file logic
    console.log("Save as file functionality not implemented yet:", filePath);
  };

  const setupMenuListeners = () => {
    onMenuNewFile(handleNewFile);
    onMenuOpenFile(handleFileOpen);
    onMenuOpenFileError(handleFileOpenError);
    onMenuSaveFile(handleSaveFile);
    onMenuSaveAsFile(handleSaveAsFile);
  };

  onMounted(() => {
    setupMenuListeners();
  });

  return {
    handleFileOpen,
    handleFileOpenError,
    handleNewFile,
    handleSaveFile,
    handleSaveAsFile,
    setupMenuListeners,
  };
}

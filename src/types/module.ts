import { LessonProps } from "@/types/lesson";
import { v4 as uuidv4 } from "uuid";

export interface ModuleProps {
  id: string;
  name: string;
  lessons: Array<LessonProps>;
  position: number;
}

export const initialModule: ModuleProps = {
  id: uuidv4(),
  name: "Module name",
  lessons: [],
  position: 1,
};

export interface ModuleDetailProps
  extends Pick<ModuleProps, "id" | "name" | "position"> {
  courseId: string;
  description: string;
  numLessons: number;
}

export const initialModuleDetail: ModuleDetailProps = {
  id: uuidv4(),
  name: "",
  position: 1,
  courseId: "",
  description: "",
  numLessons: 0,
};

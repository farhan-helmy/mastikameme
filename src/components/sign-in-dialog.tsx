

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SignIn } from "@clerk/nextjs";

export default function SignInDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Wait!</DialogTitle>
          <DialogDescription>
           Avoid losing your memes! Sign up to get access to all the features.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center">
          <SignIn routing="hash" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

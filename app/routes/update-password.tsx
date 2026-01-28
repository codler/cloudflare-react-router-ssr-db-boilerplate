import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";

export default function Page() {
  const navigate = useNavigate();

  const { mutateAsync, error, isPending } = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/auth/update-password", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      const data: any = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    },
  });

  const handleUpdatePassword: React.SubmitEventHandler = async (event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    await mutateAsync(formData);

    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Reset Your Password</CardTitle>
              <CardDescription>
                Please enter your new password below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="password">New password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="New password"
                      required
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-500">{error.message}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Saving..." : "Save new password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { Button, Flex } from "../components/ui";
import { Outlet } from "react-router";

function Layout() {
  const onLogout = async () => {
    await fetch("/auth/logout", {
      method: "POST",
    });
    window.location.href = "/login";
  };

  return (
    <div>
      <Flex className="mx-auto max-w-250 p-2 mb-4 justify-between bg-neutral-300">
        <Button className="bg-neutral-700">
          <a href="/dashboard">My profile</a>
        </Button>
        <Button className="bg-neutral-700" onClick={onLogout}>
          Logout
        </Button>
      </Flex>

      <Outlet />

      <footer className="mt-32 px-6 bg-neutral-300">
        <div className="mx-auto max-w-250 grid grid-cols-1 gap-8 py-12 transition-colors duration-150 border-b lg:grid-cols-8 border-zinc-600">
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center flex-initial font-bold">
              <a href="/">
                <span className="mr-2 border rounded-full border-zinc-700"></span>
                <span>My site</span>
              </a>
            </div>
          </div>
          <div className="col-span-1 lg:col-span-2">
            <ul className="flex flex-col flex-initial md:flex-1">
              <li className="py-3 md:py-0 md:pb-4">
                <a
                  href="/1"
                  className="transition duration-150 ease-in-out hover:text-zinc-700"
                >
                  Link 1
                </a>
              </li>
            </ul>
          </div>

          <div className="col-span-1 lg:col-span-3">
            <ul className="flex flex-col flex-initial md:flex-1">
              <li className="py-3 md:py-0 md:pb-4">
                <a
                  href="/2"
                  className="transition duration-150 ease-in-out hover:text-zinc-700"
                >
                  Link 2
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between py-12 space-y-4 md:flex-row">
          &nbsp;
        </div>
      </footer>
    </div>
  );
}

export default Layout;

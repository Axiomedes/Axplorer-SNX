using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using aXplorer.Models;

namespace aXplorer.Services
{
    public class WindowManagerService
    {
        private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

        [DllImport("user32.dll")]
        private static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

        [DllImport("user32.dll")]
        private static extern bool IsWindowVisible(IntPtr hWnd);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        private static extern int GetWindowTextLength(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        [DllImport("user32.dll")]
        private static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);

        [DllImport("user32.dll")]
        private static extern bool IsIconic(IntPtr hWnd);

        [DllImport("user32.dll", EntryPoint = "GetWindowLong")]
        private static extern int GetWindowLong32(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll", EntryPoint = "GetWindowLongPtr")]
        private static extern IntPtr GetWindowLongPtr64(IntPtr hWnd, int nIndex);

        private static IntPtr GetWindowLongPtr(IntPtr hWnd, int nIndex)
        {
            try
            {
                if (IntPtr.Size == 8)
                    return GetWindowLongPtr64(hWnd, nIndex);
                else
                    return new IntPtr(GetWindowLong32(hWnd, nIndex));
            }
            catch
            {
                return new IntPtr(GetWindowLong32(hWnd, nIndex));
            }
        }

        private const int GWL_STYLE = -16;
        private const int GWL_EXSTYLE = -20;
        private const long WS_VISIBLE = 0x10000000L;
        private const long WS_EX_TOOLWINDOW = 0x00000080L;
        private const int SW_RESTORE = 9;

        public List<WindowNode> GetOpenWindows()
        {
            var windows = new List<WindowNode>();
            try
            {
                int currentPid = Process.GetCurrentProcess().Id;

                EnumWindows((hWnd, lParam) =>
                {
                    try
                    {
                        if (!IsWindowVisible(hWnd)) return true;

                        int length = GetWindowTextLength(hWnd);
                        if (length == 0) return true;

                        long exStyle = (long)GetWindowLongPtr(hWnd, GWL_EXSTYLE);
                        if ((exStyle & WS_EX_TOOLWINDOW) != 0) return true;

                        var builder = new StringBuilder(length + 1);
                        GetWindowText(hWnd, builder, builder.Capacity);
                        string title = builder.ToString().Trim();

                        if (string.IsNullOrWhiteSpace(title)) return true;

                        // Filter out standard Windows system background windows
                        if (title == "Program Manager" || title == "Settings" || title == "Windows Input Experience" || title == "aXplorer" || title.StartsWith("Axplorer"))
                            return true;

                        GetWindowThreadProcessId(hWnd, out uint processId);
                        if (processId == currentPid) return true;

                        string procName = "App";
                        try
                        {
                            using var proc = Process.GetProcessById((int)processId);
                            procName = proc.ProcessName;
                        }
                        catch { }

                        windows.Add(new WindowNode
                        {
                            Hwnd = hWnd.ToInt64(),
                            Title = title,
                            ProcessName = procName,
                            ProcessId = (int)processId
                        });
                    }
                    catch { }

                    return true;
                }, IntPtr.Zero);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error enumerating windows: {ex.Message}");
            }

            return windows;
        }

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

        private const uint WM_CLOSE = 0x0010;

        public bool FocusWindow(long hwndVal)
        {
            try
            {
                var hWnd = new IntPtr(hwndVal);
                if (IsIconic(hWnd))
                {
                    ShowWindowAsync(hWnd, SW_RESTORE);
                }
                return SetForegroundWindow(hWnd);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error focusing window: {ex.Message}");
                return false;
            }
        }

        public bool CloseWindow(long hwndVal)
        {
            try
            {
                var hWnd = new IntPtr(hwndVal);
                if (hWnd == IntPtr.Zero) return false;

                // PostMessage sends WM_CLOSE asynchronously into the target window's message queue.
                // It functions identically to clicking the window's close (X) button or pressing Alt+F4.
                // Normal windows close immediately; documents with unsaved changes trigger their native save dialogs.
                return PostMessage(hWnd, WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error closing window {hwndVal}: {ex.Message}");
                return false;
            }
        }
    }
}

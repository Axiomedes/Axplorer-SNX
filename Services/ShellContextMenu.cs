using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;

namespace aXplorer.Services
{
    public static class ShellContextMenu
    {
        [ComImport]
        [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        [Guid("000214e6-0000-0000-c000-000000000046")]
        public interface IShellFolder
        {
            void ParseDisplayName(IntPtr hwnd, IntPtr pbc, [MarshalAs(UnmanagedType.LPWStr)] string pszDisplayName, out uint pchEaten, out IntPtr ppidl, ref uint pdwAttributes);
            void EnumObjects(IntPtr hwnd, int grfFlags, out IntPtr ppenumIDList);
            void BindToObject(IntPtr pidl, IntPtr pbc, [In] ref Guid riid, out IntPtr ppv);
            void BindToStorage(IntPtr pidl, IntPtr pbc, [In] ref Guid riid, out IntPtr ppv);
            [PreserveSig]
            int CompareIDs(IntPtr lParam, IntPtr pidl1, IntPtr pidl2);
            void CreateViewObject(IntPtr hwndOwner, [In] ref Guid riid, out IntPtr ppv);
            void GetAttributesOf(uint cidl, [MarshalAs(UnmanagedType.LPArray)] IntPtr[] apidl, ref uint rgfInOut);
            [PreserveSig]
            int GetUIObjectOf(IntPtr hwndOwner, uint cidl, [MarshalAs(UnmanagedType.LPArray)] IntPtr[] apidl, [In] ref Guid riid, IntPtr rgfReserved, out IntPtr ppv);
            void GetDisplayNameOf(IntPtr pidl, uint uFlags, IntPtr lpName);
            void SetNameOf(IntPtr hwnd, IntPtr pidl, [MarshalAs(UnmanagedType.LPWStr)] string pszName, uint uFlags, out IntPtr ppidlOut);
        }

        [ComImport]
        [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        [Guid("000214e4-0000-0000-c000-000000000046")]
        public interface IContextMenu
        {
            [PreserveSig]
            int QueryContextMenu(IntPtr hmenu, uint indexMenu, uint idCmdFirst, uint idCmdLast, uint uFlags);
            [PreserveSig]
            int InvokeCommand(ref CMINVOKECOMMANDINFOEX pici);
            [PreserveSig]
            int GetCommandString(UIntPtr idcmd, uint uflags, IntPtr reserved, [MarshalAs(UnmanagedType.LPArray)] byte[] commandstring, uint cch);
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        public struct CMINVOKECOMMANDINFOEX
        {
            public int cbSize;
            public int fMask;
            public IntPtr hwnd;
            public IntPtr lpVerb;
            [MarshalAs(UnmanagedType.LPStr)]
            public string? lpParameters;
            [MarshalAs(UnmanagedType.LPStr)]
            public string? lpDirectory;
            public int nShow;
            public int dwHotKey;
            public IntPtr hIcon;
            [MarshalAs(UnmanagedType.LPStr)]
            public string? lpTitle;
            public IntPtr lpVerbW;
            [MarshalAs(UnmanagedType.LPWStr)]
            public string? lpParametersW;
            [MarshalAs(UnmanagedType.LPWStr)]
            public string? lpDirectoryW;
            [MarshalAs(UnmanagedType.LPWStr)]
            public string? lpTitleW;
            public POINT ptInvoke;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct POINT
        {
            public int X;
            public int Y;
        }

        [DllImport("shell32.dll", CharSet = CharSet.Auto)]
        public static extern IntPtr ILCreateFromPath(string pszPath);

        [DllImport("shell32.dll")]
        public static extern void ILFree(IntPtr pidl);

        [DllImport("shell32.dll")]
        public static extern int SHBindToParent(IntPtr pidl, [In] ref Guid riid, out IntPtr ppv, out IntPtr ppidlLast);

        [DllImport("user32.dll")]
        public static extern IntPtr CreatePopupMenu();

        [DllImport("user32.dll")]
        public static extern bool DestroyMenu(IntPtr hMenu);

        [DllImport("user32.dll")]
        public static extern uint TrackPopupMenuEx(IntPtr hmenu, uint fuFlags, int x, int y, IntPtr hwnd, IntPtr lptpm);

        private const uint CMF_NORMAL = 0x00000000;
        private const uint CMF_EXPLORE = 0x00000004;
        private const uint TPM_RETURNCMD = 0x0100;
        private const uint TPM_RIGHTBUTTON = 0x0002;
        private const int SW_SHOWNORMAL = 1;
        private const int CMIC_MASK_UNICODE = 0x00004000;

        private static readonly Guid IID_IShellFolder = new("000214e6-0000-0000-c000-000000000046");
        private static readonly Guid IID_IContextMenu = new("000214e4-0000-0000-c000-000000000046");

        public static bool Show(IntPtr hwndOwner, string path, int screenX, int screenY)
        {
            if (string.IsNullOrWhiteSpace(path) || (!File.Exists(path) && !Directory.Exists(path)))
                return false;

            IntPtr pidl = ILCreateFromPath(path);
            if (pidl == IntPtr.Zero) return false;

            IntPtr pParentFolder = IntPtr.Zero;
            IntPtr pContextMenu = IntPtr.Zero;
            IntPtr hMenu = IntPtr.Zero;

            try
            {
                Guid iidFolder = IID_IShellFolder;
                int hr = SHBindToParent(pidl, ref iidFolder, out pParentFolder, out IntPtr pidlRelative);
                if (hr != 0 || pParentFolder == IntPtr.Zero) return false;

                var parent = (IShellFolder)Marshal.GetObjectForIUnknown(pParentFolder);
                Guid iidContext = IID_IContextMenu;
                hr = parent.GetUIObjectOf(hwndOwner, 1, new[] { pidlRelative }, ref iidContext, IntPtr.Zero, out pContextMenu);
                if (hr != 0 || pContextMenu == IntPtr.Zero) return false;

                var ctx = (IContextMenu)Marshal.GetObjectForIUnknown(pContextMenu);

                hMenu = CreatePopupMenu();
                if (hMenu == IntPtr.Zero) return false;

                uint flags = CMF_NORMAL | CMF_EXPLORE;
                ctx.QueryContextMenu(hMenu, 0, 1, 0x7FFF, flags);

                uint cmd = TrackPopupMenuEx(hMenu, TPM_RETURNCMD | TPM_RIGHTBUTTON, screenX, screenY, hwndOwner, IntPtr.Zero);
                if (cmd > 0)
                {
                    var cmi = new CMINVOKECOMMANDINFOEX
                    {
                        cbSize = Marshal.SizeOf<CMINVOKECOMMANDINFOEX>(),
                        fMask = CMIC_MASK_UNICODE,
                        hwnd = hwndOwner,
                        lpVerb = (IntPtr)(cmd - 1),
                        lpVerbW = (IntPtr)(cmd - 1),
                        nShow = SW_SHOWNORMAL,
                        ptInvoke = new POINT { X = screenX, Y = screenY }
                    };
                    ctx.InvokeCommand(ref cmi);
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error showing native context menu: {ex.Message}");
                return false;
            }
            finally
            {
                if (hMenu != IntPtr.Zero) DestroyMenu(hMenu);
                if (pContextMenu != IntPtr.Zero) Marshal.Release(pContextMenu);
                if (pParentFolder != IntPtr.Zero) Marshal.Release(pParentFolder);
                if (pidl != IntPtr.Zero) ILFree(pidl);
            }
        }
    }
}

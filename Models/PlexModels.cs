using System;
using System.Collections.Generic;

namespace aXplorer.Models
{
    public class FileSystemNode
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string FullPath { get; set; } = string.Empty;
        public bool IsDirectory { get; set; }
        public bool IsDrive { get; set; }
        public string Extension { get; set; } = string.Empty;
        public long SizeBytes { get; set; }
        public string FormattedSize { get; set; } = string.Empty;
        public DateTime? ModifiedDate { get; set; }
        public string ItemType { get; set; } = "file";
        public int ChildCount { get; set; }
        public string FreeSpace { get; set; } = string.Empty;
        public string TotalSpace { get; set; } = string.Empty;
        public long TotalBytes { get; set; }
        public long FreeBytes { get; set; }
        public double PercentUsed { get; set; }
        public bool IsNetwork { get; set; }
        public bool IsLibrary { get; set; }
        public string DriveTypeDescription { get; set; } = string.Empty;
    }

    public class WindowNode
    {
        public long Hwnd { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ProcessName { get; set; } = string.Empty;
        public int ProcessId { get; set; }
    }

    public class BreadcrumbItem
    {
        public string Name { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
    }

    public class PlexGraphPayload
    {
        public string ViewMode { get; set; } = "welcome"; // "welcome", "mypc", "city"
        public FileSystemNode CurrentNode { get; set; } = new();
        public List<FileSystemNode> Parents { get; set; } = new();
        public List<FileSystemNode> Children { get; set; } = new();
        public List<WindowNode> Windows { get; set; } = new();
        public List<FileSystemNode> Drives { get; set; } = new();
        public List<FileSystemNode> QuickAccess { get; set; } = new();
        public List<BreadcrumbItem> Breadcrumbs { get; set; } = new();
        public string StatusMessage { get; set; } = string.Empty;
        public int TotalItems { get; set; }
    }

    public class BridgeMessage
    {
        public string Action { get; set; } = string.Empty;
        public string? Payload { get; set; }
        public long? WindowHandle { get; set; }
    }
}

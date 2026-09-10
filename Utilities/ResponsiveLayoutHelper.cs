using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;

namespace MFCYouthAreaManagementSystem.Utilities;

/// <summary>
/// Shared layout helpers for the Phone Compatibility / Mobile Access roadmap phase.
///
/// This does not make the WinForms desktop app installable on phones yet. It creates
/// the responsive foundation we need before designing the future web/PWA companion:
/// smaller-window support, compact navigation, touch-friendlier table rows, wrapping
/// action bars, adaptive filters, and one place for future mobile breakpoints.
/// </summary>
public static class ResponsiveLayoutHelper
{
    private const int ReferenceDpi = 96;

    public const int CompactShellBreakpoint = 980;
    public const int CompactModuleBreakpoint = 840;
    public const int CompactDialogBreakpoint = 560;
    public const int CompactSidebarWidth = 76;
    public const int CompactSidebarBrandHeight = 76;
    public const int CompactPagePadding = 14;
    public const int CompactDialogPadding = 16;
    public const int CompactNavigationPadding = 0;
    public const int CompactToolbarActionsHeight = 104;
    public const int CompactToolbarGap = 14;
    public const int TouchGridRowHeight = 48;
    public const int TouchGridHeaderHeight = 48;

    /// <summary>
    /// Converts a logical 96-DPI measurement into the current control DPI. This keeps
    /// responsive spacing and minimum touch sizes visually consistent on 125%, 150%,
    /// 175%, and 200% Windows scaling.
    /// </summary>
    public static int ScaleLogical(Control control, int logicalPixels)
    {
        if (logicalPixels == 0) return 0;
        var dpi = control.DeviceDpi > 0 ? control.DeviceDpi : ReferenceDpi;
        var scaled = (int)Math.Round(logicalPixels * (dpi / (double)ReferenceDpi));
        return logicalPixels > 0 ? Math.Max(1, scaled) : Math.Min(-1, scaled);
    }

    public static Size ScaleLogical(Control control, Size logicalSize) =>
        new(ScaleLogical(control, logicalSize.Width), ScaleLogical(control, logicalSize.Height));

    public static Padding ScaleLogical(Control control, Padding logicalPadding) =>
        new(
            ScaleLogical(control, logicalPadding.Left),
            ScaleLogical(control, logicalPadding.Top),
            ScaleLogical(control, logicalPadding.Right),
            ScaleLogical(control, logicalPadding.Bottom));

    /// <summary>
    /// Returns the current client width normalized to 96-DPI logical pixels so the
    /// same responsive breakpoint is selected regardless of Windows display scaling.
    /// </summary>
    public static int LogicalClientWidth(Control control)
    {
        if (control.ClientSize.Width <= 0) return 0;
        var dpi = control.DeviceDpi > 0 ? control.DeviceDpi : ReferenceDpi;
        return (int)Math.Round(control.ClientSize.Width * (ReferenceDpi / (double)dpi));
    }

    public static bool IsCompactShell(Control control)
    {
        var width = LogicalClientWidth(control);
        return width > 0 && width < CompactShellBreakpoint;
    }

    public static bool IsCompactModule(Control control)
    {
        var width = LogicalClientWidth(control);
        return width > 0 && width < CompactModuleBreakpoint;
    }

    public static bool IsCompactDialog(Control control)
    {
        var width = LogicalClientWidth(control);
        return width > 0 && width < CompactDialogBreakpoint;
    }

    /// <summary>
    /// Makes a modal/detail window safe on smaller displays without changing its data or behavior.
    /// The preferred desktop size is preserved when there is room, while the window can shrink
    /// to a practical compact size and is clamped to the current monitor working area.
    /// </summary>
    public static void ConfigureResponsiveDialog(
        Form form,
        Size preferredSize,
        Size compactMinimumSize,
        int normalPadding = 24,
        bool allowMaximize = false)
    {
        form.Size = preferredSize;
        form.MinimumSize = compactMinimumSize;
        form.FormBorderStyle = FormBorderStyle.Sizable;
        form.MaximizeBox = allowMaximize;
        form.MinimizeBox = false;
        form.AutoScaleMode = AutoScaleMode.Dpi;

        void ApplyPadding()
        {
            var logical = IsCompactDialog(form)
                ? new Padding(CompactDialogPadding)
                : new Padding(normalPadding);
            form.Padding = ScaleLogical(form, logical);
        }

        void FitToWorkingArea()
        {
            var workingArea = Screen.FromControl(form).WorkingArea;
            var safeMargin = ScaleLogical(form, 48);
            var safeWidth = Math.Max(ScaleLogical(form, 360), workingArea.Width - safeMargin);
            var safeHeight = Math.Max(ScaleLogical(form, 420), workingArea.Height - safeMargin);
            var scaledMinimum = ScaleLogical(form, compactMinimumSize);
            var scaledPreferred = ScaleLogical(form, preferredSize);

            var minimumWidth = Math.Min(scaledMinimum.Width, safeWidth);
            var minimumHeight = Math.Min(scaledMinimum.Height, safeHeight);
            form.MinimumSize = new Size(minimumWidth, minimumHeight);

            var width = Math.Min(scaledPreferred.Width, safeWidth);
            var height = Math.Min(scaledPreferred.Height, safeHeight);
            if (form.Width > safeWidth || form.Height > safeHeight)
                form.Size = new Size(Math.Max(minimumWidth, width), Math.Max(minimumHeight, height));

            ApplyPadding();
        }

        ApplyPadding();
        form.Shown += (_, _) => FitToWorkingArea();
        form.Resize += (_, _) => ApplyPadding();
    }

    /// <summary>
    /// Reflows a fixed two-column editor table into a single-column, vertically scrollable
    /// layout when its host dialog becomes narrow. Full-width rows remain full-width.
    /// </summary>
    public static void WireResponsiveDialogGrid(
        Form host,
        TableLayoutPanel table,
        FlowLayoutPanel? actionBar = null,
        int compactActionHeight = ThemeSizes.DialogActionsHeight)
    {
        var normalColumnCount = table.ColumnCount;
        var normalRowCount = table.RowCount;
        var cells = table.Controls.Cast<Control>()
            .Select(control => (
                Control: control,
                Column: table.GetColumn(control),
                Row: table.GetRow(control),
                ColumnSpan: table.GetColumnSpan(control),
                RowSpan: table.GetRowSpan(control)))
            .OrderBy(cell => cell.Row)
            .ThenBy(cell => cell.Column)
            .ToArray();

        var columnStyles = table.ColumnStyles.Cast<ColumnStyle>()
            .Select(style => (SizeType: style.SizeType, Width: style.Width))
            .ToArray();
        var rowStyles = table.RowStyles.Cast<RowStyle>()
            .Select(style => (SizeType: style.SizeType, Height: style.Height))
            .ToArray();

        var normalContentHeight = (int)Math.Ceiling(rowStyles
            .Where(style => style.SizeType == SizeType.Absolute)
            .Sum(style => style.Height));
        bool? lastCompact = null;

        void UpdateNormalScroll()
        {
            var scaledContentHeight = ScaleLogical(host, normalContentHeight);
            var needsScroll = scaledContentHeight > 0 && table.ClientSize.Height > 0 && scaledContentHeight > table.ClientSize.Height;
            table.AutoScroll = needsScroll;
            table.AutoScrollMinSize = needsScroll ? new Size(0, scaledContentHeight) : Size.Empty;
        }

        float RowHeightFor(int row)
        {
            if (row >= 0 && row < rowStyles.Length && rowStyles[row].SizeType == SizeType.Absolute)
                return ScaleLogical(host, (int)Math.Ceiling(rowStyles[row].Height));
            return ScaleLogical(host, 90);
        }

        void ConfigureActions(bool compact)
        {
            if (actionBar == null) return;
            actionBar.FlowDirection = compact ? FlowDirection.LeftToRight : FlowDirection.RightToLeft;
            actionBar.WrapContents = compact;
            actionBar.AutoScroll = compact;
            actionBar.Padding = ScaleLogical(host, compact ? new Padding(0, 8, 0, 4) : new Padding(0, 8, 0, 0));

            foreach (Control control in actionBar.Controls)
                control.Margin = ScaleLogical(host, compact ? new Padding(0, 0, 8, 8) : new Padding(6, 0, 0, 0));
        }

        void RestoreNormal()
        {
            table.SuspendLayout();
            try
            {
                table.Controls.Clear();
                table.ColumnStyles.Clear();
                table.RowStyles.Clear();
                table.ColumnCount = normalColumnCount;
                table.RowCount = normalRowCount;

                foreach (var style in columnStyles)
                    table.ColumnStyles.Add(new ColumnStyle(style.SizeType, style.Width));
                foreach (var style in rowStyles)
                {
                    var height = style.SizeType == SizeType.Absolute
                        ? ScaleLogical(host, (int)Math.Ceiling(style.Height))
                        : style.Height;
                    table.RowStyles.Add(new RowStyle(style.SizeType, height));
                }

                foreach (var cell in cells)
                {
                    table.Controls.Add(cell.Control, cell.Column, cell.Row);
                    if (cell.ColumnSpan > 1) table.SetColumnSpan(cell.Control, cell.ColumnSpan);
                    if (cell.RowSpan > 1) table.SetRowSpan(cell.Control, cell.RowSpan);
                }

                UpdateNormalScroll();
                ConfigureActions(false);
            }
            finally
            {
                table.ResumeLayout(true);
            }
        }

        void ApplyCompact()
        {
            var compactCells = new List<(Control Control, float Height)>();
            foreach (var rowGroup in cells.GroupBy(cell => cell.Row).OrderBy(group => group.Key))
            {
                foreach (var cell in rowGroup.OrderBy(cell => cell.Column))
                {
                    var height = RowHeightFor(cell.Row);
                    if (ReferenceEquals(cell.Control, actionBar))
                        height = compactActionHeight;
                    compactCells.Add((cell.Control, height));
                }
            }

            table.SuspendLayout();
            try
            {
                table.Controls.Clear();
                table.ColumnStyles.Clear();
                table.RowStyles.Clear();
                table.ColumnCount = 1;
                table.RowCount = compactCells.Count;
                table.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));

                var contentHeight = 0;
                for (var row = 0; row < compactCells.Count; row++)
                {
                    var cell = compactCells[row];
                    table.RowStyles.Add(new RowStyle(SizeType.Absolute, cell.Height));
                    table.Controls.Add(cell.Control, 0, row);
                    table.SetColumnSpan(cell.Control, 1);
                    table.SetRowSpan(cell.Control, 1);
                    contentHeight += (int)Math.Ceiling(cell.Height);
                }

                table.AutoScroll = true;
                table.AutoScrollMinSize = new Size(0, contentHeight);
                ConfigureActions(true);
            }
            finally
            {
                table.ResumeLayout(true);
            }
        }

        void Apply()
        {
            var compact = IsCompactDialog(host);
            if (lastCompact.HasValue && lastCompact.Value == compact)
            {
                if (!compact) UpdateNormalScroll();
                return;
            }

            lastCompact = compact;
            if (compact) ApplyCompact();
            else RestoreNormal();
        }

        Apply();
        host.HandleCreated += (_, _) => Apply();
        host.Resize += (_, _) => Apply();
    }

    public static void WireResponsiveDialogActions(
        Form host,
        FlowLayoutPanel actionBar,
        TableLayoutPanel? parentTable = null,
        int normalHeight = ThemeSizes.DialogActionsHeight,
        int compactHeight = ThemeSizes.DialogActionsHeight)
    {
        void Apply()
        {
            var compact = IsCompactDialog(host);
            actionBar.FlowDirection = compact ? FlowDirection.LeftToRight : FlowDirection.RightToLeft;
            actionBar.WrapContents = compact;
            actionBar.AutoScroll = compact;
            actionBar.Padding = ScaleLogical(host, compact ? new Padding(0, 8, 0, 4) : new Padding(0, 8, 0, 0));

            foreach (Control control in actionBar.Controls)
                control.Margin = ScaleLogical(host, compact ? new Padding(0, 0, 8, 8) : new Padding(6, 0, 0, 0));

            if (parentTable != null && parentTable.Controls.Contains(actionBar))
            {
                var row = parentTable.GetRow(actionBar);
                if (row >= 0 && row < parentTable.RowStyles.Count)
                {
                    parentTable.RowStyles[row].SizeType = SizeType.Absolute;
                    parentTable.RowStyles[row].Height = ScaleLogical(host, compact ? compactHeight : normalHeight);
                }
            }
        }

        Apply();
        host.HandleCreated += (_, _) => Apply();
        host.Resize += (_, _) => Apply();
    }

    public static void WireDialogVerticalScroll(Form host, TableLayoutPanel table)
    {
        var contentHeight = (int)Math.Ceiling(table.RowStyles.Cast<RowStyle>()
            .Where(style => style.SizeType == SizeType.Absolute)
            .Sum(style => style.Height));

        void Apply()
        {
            var scaledContentHeight = ScaleLogical(host, contentHeight);
            var needsScroll = scaledContentHeight > 0 && table.ClientSize.Height > 0 && scaledContentHeight > table.ClientSize.Height;
            table.AutoScroll = needsScroll;
            table.AutoScrollMinSize = needsScroll ? new Size(0, scaledContentHeight) : Size.Empty;
        }

        Apply();
        host.HandleCreated += (_, _) => Apply();
        host.Resize += (_, _) => Apply();
    }

    public static Padding PagePaddingFor(Control control)
    {
        var logical = IsCompactShell(control) ? CompactPagePadding : ThemeSizes.PagePadding;
        var scaled = ScaleLogical(control, logical);
        return new Padding(scaled);
    }

    public static void ApplyTouchFriendlyGrid(DataGridView grid)
    {
        var rowHeight = ScaleLogical(grid, TouchGridRowHeight);
        var headerHeight = ScaleLogical(grid, TouchGridHeaderHeight);
        var horizontalPadding = ScaleLogical(grid, 10);
        grid.RowTemplate.Height = rowHeight;
        grid.RowTemplate.MinimumHeight = rowHeight;
        grid.ColumnHeadersHeight = headerHeight;
        grid.ScrollBars = ScrollBars.Both;
        grid.DefaultCellStyle.Padding = new Padding(horizontalPadding, 0, horizontalPadding, 0);
        grid.ColumnHeadersDefaultCellStyle.Padding = new Padding(horizontalPadding, 0, horizontalPadding, 0);
    }

    public static void WireResponsiveActionBar(
        Control host,
        FlowLayoutPanel actionBar,
        RowStyle? actionRowStyle = null,
        RowStyle? toolbarRowStyle = null,
        int normalActionHeight = ThemeSizes.ToolbarActionsHeight,
        int compactActionHeight = CompactToolbarActionsHeight,
        int normalToolbarHeight = 0,
        int compactToolbarHeight = 0)
    {
        void Apply()
        {
            var compact = IsCompactModule(host);
            actionBar.SuspendLayout();
            try
            {
                actionBar.FlowDirection = compact ? FlowDirection.LeftToRight : FlowDirection.RightToLeft;
                actionBar.WrapContents = compact;
                actionBar.AutoScroll = compact;
                actionBar.Padding = ScaleLogical(host, compact ? new Padding(0, 6, 0, 4) : new Padding(0, 6, 0, 6));

                foreach (Control control in actionBar.Controls)
                {
                    if (control is ModernButton button)
                    {
                        button.Margin = ScaleLogical(host, compact ? new Padding(0, 0, 8, 8) : new Padding(6, 0, 0, 0));
                        button.Height = ScaleLogical(host, ThemeSizes.ButtonHeight);
                    }
                    else
                    {
                        control.Margin = ScaleLogical(host, compact ? new Padding(0, 0, 8, 8) : new Padding(0, 0, 12, 0));
                    }
                }
            }
            finally
            {
                actionBar.ResumeLayout();
            }

            if (actionRowStyle != null)
            {
                actionRowStyle.SizeType = SizeType.Absolute;
                actionRowStyle.Height = ScaleLogical(host, compact ? compactActionHeight : normalActionHeight);
            }

            if (toolbarRowStyle != null)
            {
                toolbarRowStyle.SizeType = SizeType.Absolute;
                toolbarRowStyle.Height = ScaleLogical(host, compact && compactToolbarHeight > 0 ? compactToolbarHeight : normalToolbarHeight);
            }
        }

        Apply();
        host.HandleCreated += (_, _) => Apply();
        host.Resize += (_, _) => Apply();
    }

    public static void WireResponsiveSearchWidth(Control host, Control searchBox, int normalWidth)
    {
        void Apply()
        {
            var compact = IsCompactModule(host);
            var scaledNormalWidth = ScaleLogical(host, normalWidth);
            if (compact)
            {
                var minimumWidth = ScaleLogical(host, 220);
                var availableWidth = Math.Max(minimumWidth, host.ClientSize.Width - ScaleLogical(host, 48));
                searchBox.Width = Math.Max(minimumWidth, Math.Min(scaledNormalWidth, availableWidth));
                searchBox.Margin = ScaleLogical(host, new Padding(0, 0, 8, 8));
            }
            else
            {
                searchBox.Width = scaledNormalWidth;
                searchBox.Margin = ScaleLogical(host, new Padding(0, 0, 12, 0));
            }
        }

        Apply();
        host.HandleCreated += (_, _) => Apply();
        host.Resize += (_, _) => Apply();
    }

    public static void WireResponsiveTableLayout(
        Control host,
        TableLayoutPanel table,
        RowStyle rowStyle,
        int normalColumns,
        int compactColumns,
        int normalHeight,
        int compactHeight)
    {
        var controls = table.Controls.Cast<Control>().ToArray();

        void Apply()
        {
            var compact = IsCompactModule(host);
            var columns = compact ? compactColumns : normalColumns;
            var rows = Math.Max(1, (int)Math.Ceiling(controls.Length / (double)columns));

            table.SuspendLayout();
            try
            {
                table.Controls.Clear();
                table.ColumnStyles.Clear();
                table.RowStyles.Clear();
                table.ColumnCount = columns;
                table.RowCount = rows;

                for (var i = 0; i < columns; i++)
                    table.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100f / columns));
                for (var i = 0; i < rows; i++)
                    table.RowStyles.Add(new RowStyle(SizeType.Percent, 100f / rows));

                for (var i = 0; i < controls.Length; i++)
                {
                    var control = controls[i];
                    var column = i % columns;
                    var row = i / columns;
                    control.Margin = CompactCardMargin(host, column, columns, compact);
                    table.Controls.Add(control, column, row);
                }
            }
            finally
            {
                table.ResumeLayout();
            }

            rowStyle.SizeType = SizeType.Absolute;
            rowStyle.Height = ScaleLogical(host, compact ? compactHeight : normalHeight);
        }

        Apply();
        host.HandleCreated += (_, _) => Apply();
        host.Resize += (_, _) => Apply();
    }

    public static void WireCompactRowVisibility(Control host, Control control, RowStyle rowStyle, int normalHeight)
    {
        void Apply()
        {
            var compact = IsCompactModule(host);
            control.Visible = !compact;
            rowStyle.SizeType = SizeType.Absolute;
            rowStyle.Height = compact ? 0 : ScaleLogical(host, normalHeight);
        }

        Apply();
        host.HandleCreated += (_, _) => Apply();
        host.Resize += (_, _) => Apply();
    }


    public static void WireResponsiveServiceCards(Control host, FlowLayoutPanel cardsPanel)
    {
        void Apply()
        {
            var compact = IsCompactModule(host);
            var compactMinimum = ScaleLogical(host, 240);
            var compactMaximum = ScaleLogical(host, 420);
            var cardWidth = compact
                ? Math.Max(compactMinimum, Math.Min(compactMaximum, Math.Max(compactMinimum, host.ClientSize.Width - ScaleLogical(host, 32))))
                : ScaleLogical(host, 270);

            foreach (var card in cardsPanel.Controls.OfType<ServiceCard>())
            {
                card.Width = cardWidth;
                card.Margin = ScaleLogical(host, compact ? new Padding(0, 0, 0, 14) : new Padding(0, 0, 16, 16));
            }
        }

        Apply();
        host.HandleCreated += (_, _) => Apply();
        host.Resize += (_, _) => Apply();
        cardsPanel.ControlAdded += (_, _) => Apply();
    }

    public static void WireResponsiveGridColumns(Control host, DataGridView grid, params ResponsiveGridColumnRule[] rules)
    {
        void Apply()
        {
            var width = LogicalClientWidth(host);
            if (width <= 0) return;

            foreach (var rule in rules)
            {
                if (grid.Columns.Contains(rule.ColumnName))
                    grid.Columns[rule.ColumnName].Visible = width >= rule.HideBelowWidth;
            }
        }

        Apply();
        host.HandleCreated += (_, _) => Apply();
        host.Resize += (_, _) => Apply();
    }

    private static Padding CompactCardMargin(Control host, int column, int columns, bool compact)
    {
        var logical = !compact
            ? new Padding(column == 0 ? 0 : 6, 0, column == columns - 1 ? 0 : 6, 0)
            : new Padding(column == 0 ? 0 : 6, 0, column == columns - 1 ? 0 : 6, 10);
        return ScaleLogical(host, logical);
    }
}

public sealed record ResponsiveGridColumnRule(string ColumnName, int HideBelowWidth);

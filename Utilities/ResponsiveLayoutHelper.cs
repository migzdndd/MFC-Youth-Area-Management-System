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

    public static bool IsCompactShell(Control control) =>
        control.ClientSize.Width > 0 && control.ClientSize.Width < CompactShellBreakpoint;

    public static bool IsCompactModule(Control control) =>
        control.ClientSize.Width > 0 && control.ClientSize.Width < CompactModuleBreakpoint;

    public static bool IsCompactDialog(Control control) =>
        control.ClientSize.Width > 0 && control.ClientSize.Width < CompactDialogBreakpoint;

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
            form.Padding = IsCompactDialog(form)
                ? new Padding(CompactDialogPadding)
                : new Padding(normalPadding);
        }

        void FitToWorkingArea()
        {
            var workingArea = Screen.FromControl(form).WorkingArea;
            var safeWidth = Math.Max(360, workingArea.Width - 48);
            var safeHeight = Math.Max(420, workingArea.Height - 48);

            var minimumWidth = Math.Min(compactMinimumSize.Width, safeWidth);
            var minimumHeight = Math.Min(compactMinimumSize.Height, safeHeight);
            form.MinimumSize = new Size(minimumWidth, minimumHeight);

            var width = Math.Min(preferredSize.Width, safeWidth);
            var height = Math.Min(preferredSize.Height, safeHeight);
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
            var needsScroll = normalContentHeight > 0 && table.ClientSize.Height > 0 && normalContentHeight > table.ClientSize.Height;
            table.AutoScroll = needsScroll;
            table.AutoScrollMinSize = needsScroll ? new Size(0, normalContentHeight) : Size.Empty;
        }

        float RowHeightFor(int row)
        {
            if (row >= 0 && row < rowStyles.Length && rowStyles[row].SizeType == SizeType.Absolute)
                return rowStyles[row].Height;
            return 90f;
        }

        void ConfigureActions(bool compact)
        {
            if (actionBar == null) return;
            actionBar.FlowDirection = compact ? FlowDirection.LeftToRight : FlowDirection.RightToLeft;
            actionBar.WrapContents = compact;
            actionBar.AutoScroll = compact;
            actionBar.Padding = compact ? new Padding(0, 8, 0, 4) : new Padding(0, 8, 0, 0);

            foreach (Control control in actionBar.Controls)
                control.Margin = compact ? new Padding(0, 0, 8, 8) : new Padding(6, 0, 0, 0);
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
                    table.RowStyles.Add(new RowStyle(style.SizeType, style.Height));

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
            actionBar.Padding = compact ? new Padding(0, 8, 0, 4) : new Padding(0, 8, 0, 0);

            foreach (Control control in actionBar.Controls)
                control.Margin = compact ? new Padding(0, 0, 8, 8) : new Padding(6, 0, 0, 0);

            if (parentTable != null && parentTable.Controls.Contains(actionBar))
            {
                var row = parentTable.GetRow(actionBar);
                if (row >= 0 && row < parentTable.RowStyles.Count)
                {
                    parentTable.RowStyles[row].SizeType = SizeType.Absolute;
                    parentTable.RowStyles[row].Height = compact ? compactHeight : normalHeight;
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
            var needsScroll = contentHeight > 0 && table.ClientSize.Height > 0 && contentHeight > table.ClientSize.Height;
            table.AutoScroll = needsScroll;
            table.AutoScrollMinSize = needsScroll ? new Size(0, contentHeight) : Size.Empty;
        }

        Apply();
        host.HandleCreated += (_, _) => Apply();
        host.Resize += (_, _) => Apply();
    }

    public static Padding PagePaddingFor(Control control) =>
        IsCompactShell(control) ? new Padding(CompactPagePadding) : new Padding(ThemeSizes.PagePadding);

    public static void ApplyTouchFriendlyGrid(DataGridView grid)
    {
        grid.RowTemplate.Height = TouchGridRowHeight;
        grid.RowTemplate.MinimumHeight = TouchGridRowHeight;
        grid.ColumnHeadersHeight = TouchGridHeaderHeight;
        grid.ScrollBars = ScrollBars.Both;
        grid.DefaultCellStyle.Padding = new Padding(10, 0, 10, 0);
        grid.ColumnHeadersDefaultCellStyle.Padding = new Padding(10, 0, 10, 0);
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
                actionBar.Padding = compact ? new Padding(0, 6, 0, 4) : new Padding(0, 6, 0, 6);

                foreach (Control control in actionBar.Controls)
                {
                    if (control is ModernButton button)
                    {
                        button.Margin = compact ? new Padding(0, 0, 8, 8) : new Padding(6, 0, 0, 0);
                        button.Height = ThemeSizes.ButtonHeight;
                    }
                    else
                    {
                        control.Margin = compact ? new Padding(0, 0, 8, 8) : new Padding(0, 0, 12, 0);
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
                actionRowStyle.Height = compact ? compactActionHeight : normalActionHeight;
            }

            if (toolbarRowStyle != null)
            {
                toolbarRowStyle.SizeType = SizeType.Absolute;
                toolbarRowStyle.Height = compact && compactToolbarHeight > 0 ? compactToolbarHeight : normalToolbarHeight;
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
            if (IsCompactModule(host))
            {
                searchBox.Width = Math.Max(220, Math.Min(normalWidth, Math.Max(220, host.ClientSize.Width - 48)));
                searchBox.Margin = new Padding(0, 0, 8, 8);
            }
            else
            {
                searchBox.Width = normalWidth;
                searchBox.Margin = new Padding(0, 0, 12, 0);
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
                    control.Margin = CompactCardMargin(column, columns, compact);
                    table.Controls.Add(control, column, row);
                }
            }
            finally
            {
                table.ResumeLayout();
            }

            rowStyle.SizeType = SizeType.Absolute;
            rowStyle.Height = compact ? compactHeight : normalHeight;
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
            rowStyle.Height = compact ? 0 : normalHeight;
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
            var cardWidth = compact
                ? Math.Max(240, Math.Min(420, Math.Max(240, host.ClientSize.Width - 32)))
                : 270;

            foreach (var card in cardsPanel.Controls.OfType<ServiceCard>())
            {
                card.Width = cardWidth;
                card.Margin = compact ? new Padding(0, 0, 0, 14) : new Padding(0, 0, 16, 16);
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
            var width = host.ClientSize.Width;
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

    private static Padding CompactCardMargin(int column, int columns, bool compact)
    {
        if (!compact)
            return new Padding(column == 0 ? 0 : 6, 0, column == columns - 1 ? 0 : 6, 0);

        return new Padding(column == 0 ? 0 : 6, 0, column == columns - 1 ? 0 : 6, 10);
    }
}

public sealed record ResponsiveGridColumnRule(string ColumnName, int HideBelowWidth);

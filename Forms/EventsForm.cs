using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class EventsForm : Form
{
    private readonly Dashboard _dashboard;
    private readonly EventRepository _repo = new();
    private readonly DataGridView _grid = UiHelper.CreateGrid();
    private readonly ModernTextBox _search = new() { Placeholder = "Search events by name, venue, or description..." };
    private readonly EmptyStatePanel _empty = new("No Events Yet", "Create your first Event to begin managing registrations and participants.");

    public EventsForm(Dashboard dashboard)
    {
        _dashboard = dashboard;
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        AutoScaleMode = AutoScaleMode.Dpi;

        var root = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 3,
            Margin = Padding.Empty,
            Padding = Padding.Empty
        };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.PageHeaderHeight));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarSearchHeight + ThemeSizes.ToolbarActionsHeight + 12));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Controls.Add(root);

        root.Controls.Add(new PageHeader("Events", "Create Events, track attendance, collect registration summaries, and manage participants."), 0, 0);

        var tools = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 2,
            Padding = new Padding(0, 6, 0, 6),
            Margin = Padding.Empty
        };
        tools.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        tools.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarSearchHeight));
        tools.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarActionsHeight));
        _search.Dock = DockStyle.Fill;
        _search.Margin = new Padding(0, 3, 0, 3);
        tools.Controls.Add(_search, 0, 0);

        var actions = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.RightToLeft,
            WrapContents = false,
            Padding = new Padding(0, 6, 0, 6),
            Margin = Padding.Empty,
            BackColor = ThemeColors.Background
        };
        var add = Btn("+ Add Event", 120, ModernButtonStyle.Primary);
        var view = Btn("View", 82, ModernButtonStyle.Secondary);
        var edit = Btn("Edit", 82, ModernButtonStyle.Secondary);
        var delete = Btn("Delete", 82, ModernButtonStyle.Danger);
        var refresh = Btn("Refresh", 86, ModernButtonStyle.Ghost);
        add.Click += (_, _) => Add();
        view.Click += (_, _) => View();
        edit.Click += (_, _) => Edit();
        delete.Click += (_, _) => Delete();
        refresh.Click += (_, _) => LoadRows();
        actions.Controls.AddRange(new Control[] { add, delete, edit, view, refresh });
        tools.Controls.Add(actions, 0, 1);
        root.Controls.Add(tools, 0, 1);

        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Date & Time", DataPropertyName = "EventDateTime", Width = 170, DefaultCellStyle = { Format = "MMM d, yyyy h:mm tt" } });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Event", DataPropertyName = "EventName", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill, MinimumWidth = 180 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Venue", DataPropertyName = "Venue", Width = 170 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Fee", DataPropertyName = "RegistrationFee", Width = 105, DefaultCellStyle = { Format = "C2", FormatProvider = System.Globalization.CultureInfo.GetCultureInfo("en-PH"), NullValue = "—" } });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Registered", DataPropertyName = "RegisteredCount", Width = 95 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Attended", DataPropertyName = "PeopleAttended", Width = 85 });
        _grid.DoubleClick += (_, _) => View();

        var content = new Panel { Dock = DockStyle.Fill, Margin = Padding.Empty };
        content.Controls.Add(_grid);
        content.Controls.Add(_empty);
        root.Controls.Add(content, 0, 2);

        _search.TextValueChanged += (_, _) => LoadRows();
        Shown += (_, _) => LoadRows();
    }

    private static ModernButton Btn(string text, int width, ModernButtonStyle style) => new()
    {
        Text = text,
        Width = width,
        ButtonStyle = style,
        Margin = new Padding(6, 0, 0, 0)
    };

    private AreaEvent? Selected() => _grid.CurrentRow?.DataBoundItem as AreaEvent;

    private void LoadRows()
    {
        try
        {
            var rows = _repo.GetAll(_search.TextValue);
            _grid.DataSource = rows;
            _grid.Visible = rows.Count > 0;
            _empty.Visible = rows.Count == 0;
            if (_grid.Visible) _grid.BringToFront(); else _empty.BringToFront();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load Events", ex);
            _dashboard.Notify("Could not load Events.", true);
        }
    }

    private void Add()
    {
        if (ModalHelper.Show(this, () => new EventEditorForm(), "Open Add Event") != DialogResult.OK) return;
        LoadRows();
        _dashboard.Notify("Event created.");
    }

    private void View()
    {
        var areaEvent = Selected();
        if (areaEvent == null) return;
        try
        {
            using var form = new EventDetailsForm(areaEvent.EventID);
            form.ShowDialog(this);
            LoadRows();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Open Event Details", ex);
            CustomDialog.Show(this, "Event Could Not Open", ex.Message, true);
        }
    }

    private void Edit()
    {
        var areaEvent = Selected();
        if (areaEvent == null) return;
        if (ModalHelper.Show(this, () => new EventEditorForm(areaEvent.EventID), "Open Edit Event") != DialogResult.OK) return;
        LoadRows();
        _dashboard.Notify("Event updated.");
    }

    private void Delete()
    {
        var areaEvent = Selected();
        if (areaEvent == null) return;
        var participantText = areaEvent.RegisteredCount == 1 ? "1 registered participant" : $"{areaEvent.RegisteredCount} registered participants";
        if (!CustomDialog.Confirm(this, "Delete Event?", $"{areaEvent.EventName} and {participantText} will be permanently deleted.\n\nThis action cannot be undone.", "Delete Event", true)) return;
        try
        {
            _repo.Delete(areaEvent.EventID);
            LoadRows();
            _dashboard.Notify("Event deleted.");
        }
        catch (Exception ex)
        {
            AppLogger.Error("Delete Event", ex);
            CustomDialog.Show(this, "Delete Failed", ex.Message, true);
        }
    }

    protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
    {
        if (keyData == Keys.F5) { LoadRows(); return true; }
        if (keyData == (Keys.Control | Keys.N)) { Add(); return true; }
        if (keyData == Keys.Enter && _grid.Focused) { View(); return true; }
        if (keyData == Keys.Delete && _grid.Focused) { Delete(); return true; }
        return base.ProcessCmdKey(ref msg, keyData);
    }
}

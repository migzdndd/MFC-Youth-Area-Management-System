using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Data;
using System.Data.SQLite;
using MFC_Youth_Database.Database;

namespace MFC_Youth_Database.Forms
{
    public partial class ActivityForm : Form
    {

        public bool IsEmbedded { get; set; } = false;

        public ActivityForm()
        {
            InitializeComponent();
        }

        private void LoadReports()
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
                SELECT
                    r.ReportID,
                    r.Title,
                    c.ChapterName,
                    r.ReportType,
                    r.Activity,
                    r.ReportDate,
                    r.PreparedBy
                FROM Report r
                INNER JOIN Chapter c
                    ON r.ChapterID = c.ChapterID
                ORDER BY r.ReportDate DESC;";

                    SQLiteDataAdapter adapter = new SQLiteDataAdapter(query, conn);

                    DataTable dt = new DataTable();
                    adapter.Fill(dt);

                    dgvReports.DataSource = dt;

                    dgvReports.Columns["ReportID"].Visible = false;

                    dgvReports.Columns["Title"].HeaderText = "Title";
                    dgvReports.Columns["ChapterName"].HeaderText = "Chapter";
                    dgvReports.Columns["ReportType"].HeaderText = "Type";
                    dgvReports.Columns["Activity"].HeaderText = "Activity";
                    dgvReports.Columns["ReportDate"].HeaderText = "Date";
                    dgvReports.Columns["PreparedBy"].HeaderText = "Prepared By";
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    ex.Message,
                    "Database Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private void SearchReports(string keyword)
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
                SELECT
                    r.ReportID,
                    r.Title,
                    c.ChapterName,
                    r.ReportType,
                    r.Activity,
                    r.ReportDate,
                    r.PreparedBy
                FROM Report r
                INNER JOIN Chapter c
                    ON r.ChapterID = c.ChapterID
                WHERE
                    r.Title LIKE @Search
                    OR c.ChapterName LIKE @Search
                    OR r.ReportType LIKE @Search
                    OR r.Activity LIKE @Search
                    OR r.PreparedBy LIKE @Search
                ORDER BY r.ReportDate DESC;";

                    SQLiteDataAdapter adapter = new SQLiteDataAdapter(query, conn);
                    adapter.SelectCommand.Parameters.AddWithValue("@Search", "%" + keyword + "%");

                    DataTable dt = new DataTable();
                    adapter.Fill(dt);

                    dgvReports.DataSource = dt;
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    ex.Message,
                    "Database Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private void ReportsForm_Shown(object sender, EventArgs e)
        {
            if (!IsEmbedded)
                return;

            pnlHeader.Visible = false;
        }

        private void btnAdd_Click(object sender, EventArgs e)
        {
            using (AddActivityForm frm = new AddActivityForm())
            {
                if (frm.ShowDialog() == DialogResult.OK)
                {
                    LoadReports();
                }
            }
        }

        private void ReportsForm_Load(object sender, EventArgs e)
        {
            LoadReports();
        }

        private void btnRefresh_Click(object sender, EventArgs e)
        {
            LoadReports();
        }

        private void txtSearch_TextChanged(object sender, EventArgs e)
        {
            SearchReports(txtSearch.Text.Trim());
        }

        private void dgvReports_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0)
                return;

            int reportId = Convert.ToInt32(
                dgvReports.Rows[e.RowIndex].Cells[0].Value);

            using (EditActivityForm frm = new EditActivityForm(reportId))
            {
                if (frm.ShowDialog() == DialogResult.OK)
                {
                    LoadReports();
                }
            }
        }

        private void dgvReports_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {

        }

        private void btnDelete_Click(object sender, EventArgs e)
        {
            if (dgvReports.CurrentRow == null)
            {
                MessageBox.Show(
                    "Please select a report to delete.",
                    "Delete Report",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                return;
            }

            int reportId = Convert.ToInt32(dgvReports.CurrentRow.Cells[0].Value);

            DialogResult result = MessageBox.Show(
                "Are you sure you want to delete this report?",
                "Confirm Delete",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question);

            if (result != DialogResult.Yes)
                return;

            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query =
                        "DELETE FROM Report WHERE ReportID = @ReportID;";

                    using (SQLiteCommand cmd = new SQLiteCommand(query, conn))
                    {
                        cmd.Parameters.AddWithValue("@ReportID", reportId);
                        cmd.ExecuteNonQuery();
                    }
                }

                MessageBox.Show(
                    "Activity deleted successfully.",
                    "Success",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);

                LoadReports();
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    ex.Message,
                    "Database Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }
        private void btnBack_Click(object sender, EventArgs e)
        {
            if (this.ParentForm is Dashboard dashboard)
            {
                dashboard.ShowHome();
            }
        }
    }
}

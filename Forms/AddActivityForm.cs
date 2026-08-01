using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Data.SQLite;
using MFC_Youth_Database.Database;

namespace MFC_Youth_Database.Forms
{
    public partial class AddActivityForm : Form
    {
        public AddActivityForm()
        {
            InitializeComponent();

            LoadChapters();
            LoadActivityTypes();
        }

        private void LoadChapters()
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
                SELECT ChapterID, ChapterName
                FROM Chapter
                ORDER BY ChapterName;";

                    SQLiteDataAdapter adapter = new SQLiteDataAdapter(query, conn);
                    DataTable dt = new DataTable();
                    adapter.Fill(dt);

                    cmbChapter.DataSource = dt;
                    cmbChapter.DisplayMember = "ChapterName";
                    cmbChapter.ValueMember = "ChapterID";
                    cmbChapter.SelectedIndex = -1;
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Unable to load chapters.\n\n" + ex.Message,
                    "Database Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private void LoadActivityTypes()
        {
            cmbReportType.Items.Clear();

            cmbReportType.Items.Add("Household");
            cmbReportType.Items.Add("Chapter Assembly");
            cmbReportType.Items.Add("Area Event");

            cmbReportType.SelectedIndex = -1;
        }

        private bool ValidateForm()
        {
            if (string.IsNullOrWhiteSpace(txtTitle.Text))
            {
                MessageBox.Show("Please enter a report title.",
                    "Validation",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                txtTitle.Focus();
                return false;
            }

            if (cmbChapter.SelectedIndex == -1)
            {
                MessageBox.Show("Please select a chapter.",
                    "Validation",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                cmbChapter.Focus();
                return false;
            }

            if (cmbReportType.SelectedIndex == -1)
            {
                MessageBox.Show("Please select a report type.",
                    "Validation",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                cmbReportType.Focus();
                return false;
            }

            if (string.IsNullOrWhiteSpace(rtbDescription.Text))
            {
                MessageBox.Show("Please enter the report description.",
                    "Validation",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                rtbDescription.Focus();
                return false;
            }

            return true;
        }

        private void btnSave_Click(object sender, EventArgs e)
        {
            if (!ValidateForm())
                return;

            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
                    INSERT INTO Report
                    (
                        Title,
                        ChapterID,
                        ReportType,
                        Activity,
                        ReportDate,
                        PreparedBy,
                        Description
                    )
                    VALUES
                    (
                        @Title,
                        @ChapterID,
                        @ReportType,
                        @Activity,
                        @ReportDate,
                        @PreparedBy,
                        @Description
                    );";

                    using (SQLiteCommand cmd = new SQLiteCommand(query, conn))
                    {
                        cmd.Parameters.AddWithValue("@Title", txtTitle.Text.Trim());

                        cmd.Parameters.AddWithValue("@ChapterID", cmbChapter.SelectedValue);

                        cmd.Parameters.AddWithValue("@ReportType", cmbReportType.Text.Trim());

                        cmd.Parameters.AddWithValue("@Activity", rtbDescription.Text.Trim());

                        cmd.Parameters.AddWithValue(
                            "@ReportDate",
                            dtpReportDate.Value.ToString("yyyy-MM-dd"));

                        cmd.Parameters.AddWithValue(
                            "@PreparedBy",
                            txtPreparedBy.Text.Trim());

                        cmd.Parameters.AddWithValue(
                            "@Description",
                            rtbDescription.Text.Trim());

                        cmd.ExecuteNonQuery();
                    }
                }

                MessageBox.Show(
                    "Activity saved successfully.",
                    "Success",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);

                DialogResult = DialogResult.OK;
                Close();
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
    }
}

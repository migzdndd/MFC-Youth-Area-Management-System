namespace MFC_Youth_Database.Forms
{
    partial class EditActivityForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.tblMain = new System.Windows.Forms.TableLayoutPanel();
            this.lblTitle = new System.Windows.Forms.Label();
            this.lblChapter = new System.Windows.Forms.Label();
            this.lblReportType = new System.Windows.Forms.Label();
            this.lblActivity = new System.Windows.Forms.Label();
            this.lblReportDate = new System.Windows.Forms.Label();
            this.lblPreparedBy = new System.Windows.Forms.Label();
            this.lblDescription = new System.Windows.Forms.Label();
            this.txtTitle = new System.Windows.Forms.TextBox();
            this.cmbChapter = new System.Windows.Forms.ComboBox();
            this.cmbReportType = new System.Windows.Forms.ComboBox();
            this.txtActivity = new System.Windows.Forms.TextBox();
            this.dtpReportDate = new System.Windows.Forms.DateTimePicker();
            this.txtPreparedBy = new System.Windows.Forms.TextBox();
            this.rtbDescription = new System.Windows.Forms.RichTextBox();
            this.flpButtons = new System.Windows.Forms.FlowLayoutPanel();
            this.btnDelete = new System.Windows.Forms.Button();
            this.btnAddChapter = new System.Windows.Forms.Button();
            this.tblMain.SuspendLayout();
            this.flpButtons.SuspendLayout();
            this.SuspendLayout();
            // 
            // tblMain
            // 
            this.tblMain.ColumnCount = 2;
            this.tblMain.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 30F));
            this.tblMain.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 70F));
            this.tblMain.Controls.Add(this.lblTitle, 0, 0);
            this.tblMain.Controls.Add(this.lblChapter, 0, 1);
            this.tblMain.Controls.Add(this.lblReportType, 0, 2);
            this.tblMain.Controls.Add(this.lblActivity, 0, 3);
            this.tblMain.Controls.Add(this.lblReportDate, 0, 4);
            this.tblMain.Controls.Add(this.lblPreparedBy, 0, 5);
            this.tblMain.Controls.Add(this.lblDescription, 0, 6);
            this.tblMain.Controls.Add(this.txtTitle, 1, 0);
            this.tblMain.Controls.Add(this.cmbChapter, 1, 1);
            this.tblMain.Controls.Add(this.cmbReportType, 1, 2);
            this.tblMain.Controls.Add(this.txtActivity, 1, 3);
            this.tblMain.Controls.Add(this.dtpReportDate, 1, 4);
            this.tblMain.Controls.Add(this.txtPreparedBy, 1, 5);
            this.tblMain.Controls.Add(this.rtbDescription, 1, 6);
            this.tblMain.Controls.Add(this.flpButtons, 1, 7);
            this.tblMain.Dock = System.Windows.Forms.DockStyle.Fill;
            this.tblMain.Location = new System.Drawing.Point(0, 0);
            this.tblMain.Name = "tblMain";
            this.tblMain.Padding = new System.Windows.Forms.Padding(20);
            this.tblMain.RowCount = 8;
            this.tblMain.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 50F));
            this.tblMain.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 50F));
            this.tblMain.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 50F));
            this.tblMain.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 50F));
            this.tblMain.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 50F));
            this.tblMain.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 50F));
            this.tblMain.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 100F));
            this.tblMain.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 60F));
            this.tblMain.Size = new System.Drawing.Size(784, 661);
            this.tblMain.TabIndex = 3;
            // 
            // lblTitle
            // 
            this.lblTitle.Anchor = System.Windows.Forms.AnchorStyles.Left;
            this.lblTitle.AutoSize = true;
            this.lblTitle.Font = new System.Drawing.Font("Segoe UI", 9.75F, System.Drawing.FontStyle.Bold);
            this.lblTitle.Location = new System.Drawing.Point(23, 36);
            this.lblTitle.Name = "lblTitle";
            this.lblTitle.Size = new System.Drawing.Size(81, 17);
            this.lblTitle.TabIndex = 0;
            this.lblTitle.Text = "Report Title";
            this.lblTitle.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // lblChapter
            // 
            this.lblChapter.Anchor = System.Windows.Forms.AnchorStyles.Left;
            this.lblChapter.AutoSize = true;
            this.lblChapter.Font = new System.Drawing.Font("Segoe UI", 9.75F, System.Drawing.FontStyle.Bold);
            this.lblChapter.Location = new System.Drawing.Point(23, 86);
            this.lblChapter.Name = "lblChapter";
            this.lblChapter.Size = new System.Drawing.Size(56, 17);
            this.lblChapter.TabIndex = 1;
            this.lblChapter.Text = "Chapter";
            this.lblChapter.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // lblReportType
            // 
            this.lblReportType.Anchor = System.Windows.Forms.AnchorStyles.Left;
            this.lblReportType.AutoSize = true;
            this.lblReportType.Font = new System.Drawing.Font("Segoe UI", 9.75F, System.Drawing.FontStyle.Bold);
            this.lblReportType.Location = new System.Drawing.Point(23, 136);
            this.lblReportType.Name = "lblReportType";
            this.lblReportType.Size = new System.Drawing.Size(82, 17);
            this.lblReportType.TabIndex = 2;
            this.lblReportType.Text = "Report Type";
            this.lblReportType.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // lblActivity
            // 
            this.lblActivity.Anchor = System.Windows.Forms.AnchorStyles.Left;
            this.lblActivity.AutoSize = true;
            this.lblActivity.Font = new System.Drawing.Font("Segoe UI", 9.75F, System.Drawing.FontStyle.Bold);
            this.lblActivity.Location = new System.Drawing.Point(23, 186);
            this.lblActivity.Name = "lblActivity";
            this.lblActivity.Size = new System.Drawing.Size(55, 17);
            this.lblActivity.TabIndex = 3;
            this.lblActivity.Text = "Activity";
            this.lblActivity.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // lblReportDate
            // 
            this.lblReportDate.Anchor = System.Windows.Forms.AnchorStyles.Left;
            this.lblReportDate.AutoSize = true;
            this.lblReportDate.Font = new System.Drawing.Font("Segoe UI", 9.75F, System.Drawing.FontStyle.Bold);
            this.lblReportDate.Location = new System.Drawing.Point(23, 236);
            this.lblReportDate.Name = "lblReportDate";
            this.lblReportDate.Size = new System.Drawing.Size(82, 17);
            this.lblReportDate.TabIndex = 4;
            this.lblReportDate.Text = "Report Date";
            this.lblReportDate.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // lblPreparedBy
            // 
            this.lblPreparedBy.Anchor = System.Windows.Forms.AnchorStyles.Left;
            this.lblPreparedBy.AutoSize = true;
            this.lblPreparedBy.Font = new System.Drawing.Font("Segoe UI", 9.75F, System.Drawing.FontStyle.Bold);
            this.lblPreparedBy.Location = new System.Drawing.Point(23, 286);
            this.lblPreparedBy.Name = "lblPreparedBy";
            this.lblPreparedBy.Size = new System.Drawing.Size(82, 17);
            this.lblPreparedBy.TabIndex = 5;
            this.lblPreparedBy.Text = "Prepared By";
            this.lblPreparedBy.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // lblDescription
            // 
            this.lblDescription.AutoSize = true;
            this.lblDescription.Font = new System.Drawing.Font("Segoe UI", 9.75F, System.Drawing.FontStyle.Bold);
            this.lblDescription.Location = new System.Drawing.Point(23, 320);
            this.lblDescription.Name = "lblDescription";
            this.lblDescription.Size = new System.Drawing.Size(79, 17);
            this.lblDescription.TabIndex = 6;
            this.lblDescription.Text = "Description";
            this.lblDescription.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // txtTitle
            // 
            this.txtTitle.Dock = System.Windows.Forms.DockStyle.Fill;
            this.txtTitle.Font = new System.Drawing.Font("Segoe UI", 8.25F);
            this.txtTitle.Location = new System.Drawing.Point(246, 23);
            this.txtTitle.Name = "txtTitle";
            this.txtTitle.Size = new System.Drawing.Size(515, 22);
            this.txtTitle.TabIndex = 7;
            // 
            // cmbChapter
            // 
            this.cmbChapter.Dock = System.Windows.Forms.DockStyle.Fill;
            this.cmbChapter.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbChapter.Font = new System.Drawing.Font("Segoe UI", 8.25F);
            this.cmbChapter.FormattingEnabled = true;
            this.cmbChapter.Location = new System.Drawing.Point(246, 73);
            this.cmbChapter.Name = "cmbChapter";
            this.cmbChapter.Size = new System.Drawing.Size(515, 21);
            this.cmbChapter.TabIndex = 8;
            // 
            // cmbReportType
            // 
            this.cmbReportType.Dock = System.Windows.Forms.DockStyle.Fill;
            this.cmbReportType.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbReportType.Font = new System.Drawing.Font("Segoe UI", 8.25F);
            this.cmbReportType.FormattingEnabled = true;
            this.cmbReportType.Location = new System.Drawing.Point(246, 123);
            this.cmbReportType.Name = "cmbReportType";
            this.cmbReportType.Size = new System.Drawing.Size(515, 21);
            this.cmbReportType.TabIndex = 9;
            // 
            // txtActivity
            // 
            this.txtActivity.Dock = System.Windows.Forms.DockStyle.Fill;
            this.txtActivity.Font = new System.Drawing.Font("Segoe UI", 8.25F);
            this.txtActivity.Location = new System.Drawing.Point(246, 173);
            this.txtActivity.Name = "txtActivity";
            this.txtActivity.Size = new System.Drawing.Size(515, 22);
            this.txtActivity.TabIndex = 10;
            // 
            // dtpReportDate
            // 
            this.dtpReportDate.Dock = System.Windows.Forms.DockStyle.Fill;
            this.dtpReportDate.Font = new System.Drawing.Font("Segoe UI", 8.25F);
            this.dtpReportDate.Location = new System.Drawing.Point(246, 223);
            this.dtpReportDate.Name = "dtpReportDate";
            this.dtpReportDate.Size = new System.Drawing.Size(515, 22);
            this.dtpReportDate.TabIndex = 11;
            // 
            // txtPreparedBy
            // 
            this.txtPreparedBy.Dock = System.Windows.Forms.DockStyle.Fill;
            this.txtPreparedBy.Font = new System.Drawing.Font("Segoe UI", 8.25F);
            this.txtPreparedBy.Location = new System.Drawing.Point(246, 273);
            this.txtPreparedBy.Name = "txtPreparedBy";
            this.txtPreparedBy.Size = new System.Drawing.Size(515, 22);
            this.txtPreparedBy.TabIndex = 12;
            // 
            // rtbDescription
            // 
            this.rtbDescription.Dock = System.Windows.Forms.DockStyle.Fill;
            this.rtbDescription.Font = new System.Drawing.Font("Segoe UI", 8.25F);
            this.rtbDescription.Location = new System.Drawing.Point(246, 323);
            this.rtbDescription.Name = "rtbDescription";
            this.rtbDescription.Size = new System.Drawing.Size(515, 255);
            this.rtbDescription.TabIndex = 13;
            this.rtbDescription.Text = "";
            // 
            // flpButtons
            // 
            this.flpButtons.Controls.Add(this.btnDelete);
            this.flpButtons.Controls.Add(this.btnAddChapter);
            this.flpButtons.Dock = System.Windows.Forms.DockStyle.Fill;
            this.flpButtons.FlowDirection = System.Windows.Forms.FlowDirection.RightToLeft;
            this.flpButtons.Location = new System.Drawing.Point(246, 584);
            this.flpButtons.Name = "flpButtons";
            this.flpButtons.Size = new System.Drawing.Size(515, 54);
            this.flpButtons.TabIndex = 14;
            // 
            // btnDelete
            // 
            this.btnDelete.BackColor = System.Drawing.Color.Crimson;
            this.btnDelete.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnDelete.Font = new System.Drawing.Font("Segoe UI", 8.25F, System.Drawing.FontStyle.Bold);
            this.btnDelete.Location = new System.Drawing.Point(408, 3);
            this.btnDelete.Name = "btnDelete";
            this.btnDelete.Size = new System.Drawing.Size(104, 36);
            this.btnDelete.TabIndex = 7;
            this.btnDelete.Text = "Cancel";
            this.btnDelete.UseVisualStyleBackColor = false;
            this.btnDelete.Click += new System.EventHandler(this.btnCancel_Click);
            // 
            // btnAddChapter
            // 
            this.btnAddChapter.BackColor = System.Drawing.Color.MediumSeaGreen;
            this.btnAddChapter.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnAddChapter.Font = new System.Drawing.Font("Segoe UI", 8.25F, System.Drawing.FontStyle.Bold);
            this.btnAddChapter.Location = new System.Drawing.Point(298, 3);
            this.btnAddChapter.Name = "btnAddChapter";
            this.btnAddChapter.Size = new System.Drawing.Size(104, 36);
            this.btnAddChapter.TabIndex = 6;
            this.btnAddChapter.Text = "Save";
            this.btnAddChapter.UseVisualStyleBackColor = false;
            this.btnAddChapter.Click += new System.EventHandler(this.btnSave_Click);
            // 
            // EditReportForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(784, 661);
            this.Controls.Add(this.tblMain);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "EditReportForm";
            this.ShowInTaskbar = false;
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterParent;
            this.Text = "Add Report";
            this.tblMain.ResumeLayout(false);
            this.tblMain.PerformLayout();
            this.flpButtons.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.TableLayoutPanel tblMain;
        private System.Windows.Forms.Label lblTitle;
        private System.Windows.Forms.Label lblChapter;
        private System.Windows.Forms.Label lblReportType;
        private System.Windows.Forms.Label lblActivity;
        private System.Windows.Forms.Label lblReportDate;
        private System.Windows.Forms.Label lblPreparedBy;
        private System.Windows.Forms.Label lblDescription;
        private System.Windows.Forms.TextBox txtTitle;
        private System.Windows.Forms.ComboBox cmbChapter;
        private System.Windows.Forms.ComboBox cmbReportType;
        private System.Windows.Forms.TextBox txtActivity;
        private System.Windows.Forms.DateTimePicker dtpReportDate;
        private System.Windows.Forms.TextBox txtPreparedBy;
        private System.Windows.Forms.RichTextBox rtbDescription;
        private System.Windows.Forms.FlowLayoutPanel flpButtons;
        private System.Windows.Forms.Button btnDelete;
        private System.Windows.Forms.Button btnAddChapter;
    }
}